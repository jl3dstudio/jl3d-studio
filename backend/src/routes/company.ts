import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { authenticate } from '../middlewares/auth'
import { success } from '../utils/response'

const companySchema = z.object({
  name: z.string().min(2).optional(),
  slogan: z.string().optional(),
  cnpj: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().optional(),
})

export default async function companyRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate)

  app.get('/', async (request, reply) => {
    const { id } = request.user as { id: string }
    const company = await prisma.company.findUnique({ where: { userId: id } })
    return reply.send(success(company))
  })

  app.put('/', async (request, reply) => {
    const { id } = request.user as { id: string }
    const body = companySchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ success: false, message: 'Dados inválidos' })

    const company = await prisma.company.upsert({
      where: { userId: id },
      update: body.data,
      create: { userId: id, name: body.data.name || 'Minha Empresa', ...body.data },
    })
    return reply.send(success(company, 'Dados da empresa atualizados'))
  })
}
