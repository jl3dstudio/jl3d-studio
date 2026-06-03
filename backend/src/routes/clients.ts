import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { authenticate } from '../middlewares/auth'
import { NotFoundError } from '../utils/errors'
import { success, paginated } from '../utils/response'
import { ClientType } from '@prisma/client'

const clientSchema = z.object({
  name: z.string().min(2),
  type: z.nativeEnum(ClientType).default(ClientType.PERSON),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  document: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

export default async function clientRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate)

  app.get('/', async (request, reply) => {
    const query = z.object({
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(20),
      search: z.string().optional(),
      type: z.nativeEnum(ClientType).optional(),
    }).parse(request.query)

    const where = {
      isActive: true,
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { email: { contains: query.search, mode: 'insensitive' as const } },
          { whatsapp: { contains: query.search } },
        ],
      }),
      ...(query.type && { type: query.type }),
    }

    const [total, clients] = await Promise.all([
      prisma.client.count({ where }),
      prisma.client.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          _count: { select: { orders: true, quotes: true } },
        },
        orderBy: { name: 'asc' },
      }),
    ])

    return reply.send(paginated(clients, total, query.page, query.limit))
  })

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        quotes: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, number: true, status: true, total: true, createdAt: true },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, number: true, status: true, total: true, createdAt: true },
        },
      },
    })
    if (!client) throw new NotFoundError('Cliente')

    // Calcular lifetime value
    const lifetimeValue = await prisma.order.aggregate({
      where: { clientId: id, status: 'DELIVERED' },
      _sum: { total: true },
    })

    return reply.send(success({ ...client, lifetimeValue: lifetimeValue._sum.total || 0 }))
  })

  app.post('/', async (request, reply) => {
    const body = clientSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ success: false, message: 'Dados inválidos', errors: body.error.flatten() })

    const client = await prisma.client.create({ data: { ...body.data, tags: body.data.tags || [] } })
    return reply.status(201).send(success(client, 'Cliente cadastrado com sucesso'))
  })

  app.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = clientSchema.partial().safeParse(request.body)
    if (!body.success) return reply.status(400).send({ success: false, message: 'Dados inválidos' })

    const client = await prisma.client.update({ where: { id }, data: body.data }).catch(() => { throw new NotFoundError('Cliente') })
    return reply.send(success(client, 'Cliente atualizado'))
  })

  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    await prisma.client.update({ where: { id }, data: { isActive: false } }).catch(() => { throw new NotFoundError('Cliente') })
    return reply.send(success(null, 'Cliente removido'))
  })
}
