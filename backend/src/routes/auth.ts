import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '../utils/prisma'
import { AppError, UnauthorizedError } from '../utils/errors'
import { success } from '../utils/response'
import { env } from '../utils/env'
import { auditLog } from '../middlewares/audit'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  rememberMe: z.boolean().optional(),
})

const forgotSchema = z.object({
  email: z.string().email(),
})

const resetSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
})

export default async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/login
  app.post('/login', async (request, reply) => {
    const body = loginSchema.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({ success: false, message: 'Dados inválidos', errors: body.error.flatten() })
    }

    const { email, password } = body.data
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    })

    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      throw new UnauthorizedError('Email ou senha incorretos')
    }
    if (!user.isActive) {
      throw new UnauthorizedError('Conta desativada. Entre em contato com o administrador.')
    }

    const accessToken = app.jwt.sign(
      { id: user.id, role: user.role },
      { expiresIn: env.JWT_EXPIRES_IN },
    )
    const refreshToken = app.jwt.sign(
      { id: user.id, type: 'refresh' },
      { secret: env.JWT_REFRESH_SECRET, expiresIn: env.JWT_REFRESH_EXPIRES_IN },
    )

    await auditLog(user.id, 'LOGIN', 'User', user.id, undefined, undefined, request)

    return reply.send(success({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        company: user.company,
      },
    }, 'Login realizado com sucesso'))
  })

  // POST /api/auth/refresh
  app.post('/refresh', async (request, reply) => {
    const body = z.object({ refreshToken: z.string() }).safeParse(request.body)
    if (!body.success) return reply.status(400).send({ success: false, message: 'Token não fornecido' })

    try {
      const payload = app.jwt.verify(body.data.refreshToken, { key: env.JWT_REFRESH_SECRET }) as { id: string; type: string }
      if (payload.type !== 'refresh') throw new Error('Token inválido')

      const user = await prisma.user.findUnique({ where: { id: payload.id } })
      if (!user || !user.isActive) throw new UnauthorizedError('Usuário não encontrado')

      const accessToken = app.jwt.sign({ id: user.id, role: user.role }, { expiresIn: env.JWT_EXPIRES_IN })
      return reply.send(success({ accessToken }))
    } catch {
      return reply.status(401).send({ success: false, message: 'Refresh token inválido ou expirado' })
    }
  })

  // POST /api/auth/forgot-password
  app.post('/forgot-password', async (request, reply) => {
    const body = forgotSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ success: false, message: 'Email inválido' })

    // Por segurança, sempre retorna sucesso mesmo se o email não existir
    const user = await prisma.user.findUnique({ where: { email: body.data.email } })
    if (user) {
      // Em produção, enviar email com token
      console.log(`[DEV] Token de reset para ${user.email}: reset_token_placeholder`)
    }

    return reply.send(success(null, 'Se o email existir, você receberá as instruções de recuperação'))
  })

  // POST /api/auth/logout
  app.post('/logout', async (_request, reply) => {
    return reply.send(success(null, 'Logout realizado com sucesso'))
  })
}
