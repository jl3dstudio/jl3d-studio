// Ponto de entrada do servidor JL3D Studio
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import multipart from '@fastify/multipart'
import staticFiles from '@fastify/static'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import path from 'path'
import { env } from './utils/env'

// Rotas
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import companyRoutes from './routes/company'
import printerRoutes from './routes/printers'
import filamentRoutes from './routes/filaments'
import productRoutes from './routes/products'
import clientRoutes from './routes/clients'
import quoteRoutes from './routes/quotes'
import orderRoutes from './routes/orders'
import revenueRoutes from './routes/revenues'
import expenseRoutes from './routes/expenses'
import dashboardRoutes from './routes/dashboard'
import settingsRoutes from './routes/settings'

export async function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV === 'development'
      ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
      : true,
  })

  // CORS
  await app.register(cors, {
    origin: env.FRONTEND_URL || true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  // Rate limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      success: false,
      message: 'Muitas requisições. Tente novamente em 1 minuto.',
    }),
  })

  // JWT
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
  })

  // Multipart (upload de arquivos)
  await app.register(multipart, {
    limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
  })

  // Arquivos estáticos (apenas fora do serverless)
  if (env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
    await app.register(staticFiles, {
      root: path.resolve(env.UPLOAD_DIR),
      prefix: '/uploads/',
    })
  }

  // Swagger — documentação da API
  await app.register(swagger, {
    openapi: {
      info: { title: 'JL3D Studio API', description: 'API do sistema de gestão JL3D Studio', version: '1.0.0' },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
  })
  await app.register(swaggerUi, { routePrefix: '/docs' })

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  // Registrar rotas
  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(userRoutes, { prefix: '/api/users' })
  await app.register(companyRoutes, { prefix: '/api/company' })
  await app.register(printerRoutes, { prefix: '/api/printers' })
  await app.register(filamentRoutes, { prefix: '/api/filaments' })
  await app.register(productRoutes, { prefix: '/api/products' })
  await app.register(clientRoutes, { prefix: '/api/clients' })
  await app.register(quoteRoutes, { prefix: '/api/quotes' })
  await app.register(orderRoutes, { prefix: '/api/orders' })
  await app.register(revenueRoutes, { prefix: '/api/revenues' })
  await app.register(expenseRoutes, { prefix: '/api/expenses' })
  await app.register(dashboardRoutes, { prefix: '/api/dashboard' })
  await app.register(settingsRoutes, { prefix: '/api/settings' })

  return app
}
