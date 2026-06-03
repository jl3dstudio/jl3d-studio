import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { authenticate } from '../middlewares/auth'
import { NotFoundError } from '../utils/errors'
import { success, paginated } from '../utils/response'
import { PaymentStatus } from '@prisma/client'

const revenueSchema = z.object({
  orderId: z.string().uuid().optional(),
  description: z.string().min(2),
  amount: z.number().positive(),
  paymentMethod: z.string().optional(),
  status: z.nativeEnum(PaymentStatus).default(PaymentStatus.PENDING),
  dueDate: z.string().optional(),
  paidAt: z.string().optional(),
  installments: z.number().int().min(1).default(1),
  notes: z.string().optional(),
})

export default async function revenueRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate)

  app.get('/', async (request, reply) => {
    const query = z.object({
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(20),
      status: z.nativeEnum(PaymentStatus).optional(),
      from: z.string().optional(),
      to: z.string().optional(),
    }).parse(request.query)

    const where = {
      ...(query.status && { status: query.status }),
      ...(query.from && query.to && {
        createdAt: { gte: new Date(query.from), lte: new Date(query.to) },
      }),
    }

    const [total, revenues] = await Promise.all([
      prisma.revenue.count({ where }),
      prisma.revenue.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: { order: { select: { number: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return reply.send(paginated(revenues, total, query.page, query.limit))
  })

  app.post('/', async (request, reply) => {
    const body = revenueSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ success: false, message: 'Dados inválidos' })

    const revenue = await prisma.revenue.create({
      data: {
        ...body.data,
        dueDate: body.data.dueDate ? new Date(body.data.dueDate) : undefined,
        paidAt: body.data.paidAt ? new Date(body.data.paidAt) : undefined,
      },
    })
    return reply.status(201).send(success(revenue, 'Receita registrada'))
  })

  app.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = revenueSchema.partial().safeParse(request.body)
    if (!body.success) return reply.status(400).send({ success: false, message: 'Dados inválidos' })

    const revenue = await prisma.revenue.update({ where: { id }, data: body.data }).catch(() => { throw new NotFoundError('Receita') })
    return reply.send(success(revenue, 'Receita atualizada'))
  })

  // PATCH confirmar recebimento
  app.patch('/:id/receive', async (request, reply) => {
    const { id } = request.params as { id: string }
    const revenue = await prisma.revenue.update({
      where: { id },
      data: { status: PaymentStatus.RECEIVED, paidAt: new Date() },
    }).catch(() => { throw new NotFoundError('Receita') })
    return reply.send(success(revenue, 'Recebimento confirmado'))
  })
}
