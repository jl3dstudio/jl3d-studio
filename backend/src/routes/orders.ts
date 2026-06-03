import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { authenticate } from '../middlewares/auth'
import { NotFoundError, AppError } from '../utils/errors'
import { success, paginated } from '../utils/response'
import { OrderStatus } from '@prisma/client'

const orderItemSchema = z.object({
  productId: z.string().uuid().optional(),
  printerId: z.string().uuid().optional(),
  filamentId: z.string().uuid().optional(),
  name: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  weightG: z.number().positive().optional(),
  printTimeMin: z.number().int().positive().optional(),
  unitPrice: z.number().positive(),
  filamentUsedG: z.number().min(0).optional(),
})

const createOrderSchema = z.object({
  clientId: z.string().uuid(),
  estimatedDelivery: z.string().optional(),
  productionNotes: z.string().optional(),
  items: z.array(orderItemSchema).min(1),
})

export default async function orderRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate)

  app.get('/', async (request, reply) => {
    const query = z.object({
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(20),
      status: z.nativeEnum(OrderStatus).optional(),
      clientId: z.string().optional(),
      search: z.string().optional(),
      from: z.string().optional(),
      to: z.string().optional(),
    }).parse(request.query)

    const where = {
      ...(query.status && { status: query.status }),
      ...(query.clientId && { clientId: query.clientId }),
      ...(query.from && query.to && {
        createdAt: { gte: new Date(query.from), lte: new Date(query.to) },
      }),
      ...(query.search && {
        OR: [
          { number: { contains: query.search, mode: 'insensitive' as const } },
          { client: { name: { contains: query.search, mode: 'insensitive' as const } } },
        ],
      }),
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          client: { select: { name: true, type: true } },
          user: { select: { name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return reply.send(paginated(orders, total, query.page, query.limit))
  })

  // GET por status para o Kanban
  app.get('/kanban', async (_request, reply) => {
    const allStatuses = Object.values(OrderStatus).filter(s => s !== 'CANCELLED')
    const result: Record<string, unknown[]> = {}

    for (const status of allStatuses) {
      result[status] = await prisma.order.findMany({
        where: { status },
        include: {
          client: { select: { name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'asc' },
      })
    }

    return reply.send(success(result))
  })

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        client: true,
        user: { select: { name: true } },
        items: {
          include: {
            product: { select: { name: true, emoji: true } },
            printer: { select: { name: true } },
            filament: { select: { name: true, colorHex: true, colorName: true } },
          },
        },
        history: { include: { user: { select: { name: true } } }, orderBy: { createdAt: 'asc' } },
        files: true,
        revenues: true,
      },
    })
    if (!order) throw new NotFoundError('Pedido')
    return reply.send(success(order))
  })

  app.post('/', async (request, reply) => {
    const body = createOrderSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ success: false, message: 'Dados inválidos', errors: body.error.flatten() })

    const { id: userId } = request.user as { id: string }
    const { items, ...rest } = body.data
    const total = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0)

    const lastOrder = await prisma.order.findFirst({ orderBy: { createdAt: 'desc' }, select: { number: true } })
    const nextNum = lastOrder ? parseInt(lastOrder.number.split('-')[1]) + 1 : 1
    const number = `PED-${String(nextNum).padStart(4, '0')}`

    const order = await prisma.order.create({
      data: {
        number,
        userId,
        subtotal: total,
        total,
        estimatedDelivery: rest.estimatedDelivery ? new Date(rest.estimatedDelivery) : undefined,
        clientId: rest.clientId,
        productionNotes: rest.productionNotes,
        items: {
          create: items.map(item => ({
            ...item,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
        history: {
          create: [{ userId, toStatus: OrderStatus.PENDING }],
        },
      },
      include: { items: true, client: { select: { name: true } } },
    })

    return reply.status(201).send(success(order, 'Pedido criado com sucesso'))
  })

  // PATCH /api/orders/:id/status — mover status (Kanban)
  app.patch('/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { id: userId } = request.user as { id: string }
    const body = z.object({
      status: z.nativeEnum(OrderStatus),
      notes: z.string().optional(),
    }).parse(request.body)

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!order) throw new NotFoundError('Pedido')

    const updateData: Record<string, unknown> = { status: body.status }

    // Baixa automática de estoque ao iniciar impressão
    if (body.status === OrderStatus.PRINTING && order.status === OrderStatus.PENDING) {
      for (const item of order.items) {
        if (item.filamentId && item.filamentUsedG) {
          await prisma.filament.update({
            where: { id: item.filamentId },
            data: { currentWeightG: { decrement: item.filamentUsedG * item.quantity } },
          })
        } else if (item.filamentId && item.weightG) {
          // Usa o peso do item como estimativa do consumo
          await prisma.filament.update({
            where: { id: item.filamentId },
            data: { currentWeightG: { decrement: item.weightG * item.quantity } },
          })
        }
      }
    }

    // Registrar data de entrega ao marcar como Entregue
    if (body.status === OrderStatus.DELIVERED) {
      updateData.deliveredAt = new Date()
      // Criar receita automática
      await prisma.revenue.create({
        data: {
          orderId: id,
          description: `Pedido ${order.number}`,
          amount: order.total,
          status: 'PENDING',
        },
      })
    }

    await prisma.$transaction([
      prisma.order.update({ where: { id }, data: updateData }),
      prisma.orderStatusHistory.create({
        data: {
          orderId: id,
          userId,
          fromStatus: order.status,
          toStatus: body.status,
          notes: body.notes,
        },
      }),
    ])

    const updated = await prisma.order.findUnique({ where: { id } })
    return reply.send(success(updated, `Pedido movido para ${body.status}`))
  })

  // PATCH /api/orders/:id — atualizar dados gerais
  app.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = z.object({
      productionNotes: z.string().optional(),
      estimatedDelivery: z.string().optional(),
      printTimeMinReal: z.number().int().optional(),
    }).parse(request.body)

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...body,
        estimatedDelivery: body.estimatedDelivery ? new Date(body.estimatedDelivery) : undefined,
      },
    }).catch(() => { throw new NotFoundError('Pedido') })

    return reply.send(success(order, 'Pedido atualizado'))
  })
}
