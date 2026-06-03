import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { authenticate } from '../middlewares/auth'
import { NotFoundError, AppError } from '../utils/errors'
import { success, paginated } from '../utils/response'
import { QuoteStatus, OrderStatus } from '@prisma/client'
import { v4 as uuid } from 'uuid'

const quoteItemSchema = z.object({
  productId: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  quantity: z.number().int().positive().default(1),
  unitPrice: z.number().positive(),
})

const quoteSchema = z.object({
  clientId: z.string().uuid(),
  discountType: z.enum(['PERCENT', 'FIXED']).optional(),
  discountValue: z.number().min(0).default(0),
  paymentMethod: z.string().optional(),
  validUntil: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(quoteItemSchema).min(1),
})

function calcQuoteTotals(items: { quantity: number; unitPrice: number }[], discountType?: string, discountValue = 0) {
  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0)
  let discount = 0
  if (discountType === 'PERCENT') discount = subtotal * (discountValue / 100)
  else if (discountType === 'FIXED') discount = discountValue
  return { subtotal, total: Math.max(subtotal - discount, 0) }
}

async function getNextQuoteNumber(): Promise<string> {
  const last = await prisma.quote.findFirst({ orderBy: { createdAt: 'desc' }, select: { number: true } })
  if (!last) return 'ORC-0001'
  const num = parseInt(last.number.split('-')[1]) + 1
  return `ORC-${String(num).padStart(4, '0')}`
}

export default async function quoteRoutes(app: FastifyInstance) {
  // Rota pública — cliente visualiza orçamento via token
  app.get('/public/:token', async (request, reply) => {
    const { token } = request.params as { token: string }
    const quote = await prisma.quote.findUnique({
      where: { publicToken: token },
      include: {
        client: { select: { name: true, email: true, whatsapp: true } },
        items: { include: { product: { select: { name: true, emoji: true } } } },
        user: { include: { company: true } },
      },
    })
    if (!quote) throw new NotFoundError('Orçamento')
    return reply.send(success(quote))
  })

  app.addHook('onRequest', authenticate)

  app.get('/', async (request, reply) => {
    const query = z.object({
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(20),
      status: z.nativeEnum(QuoteStatus).optional(),
      clientId: z.string().optional(),
      search: z.string().optional(),
    }).parse(request.query)

    const where = {
      ...(query.status && { status: query.status }),
      ...(query.clientId && { clientId: query.clientId }),
      ...(query.search && {
        OR: [
          { number: { contains: query.search, mode: 'insensitive' as const } },
          { client: { name: { contains: query.search, mode: 'insensitive' as const } } },
        ],
      }),
    }

    const [total, quotes] = await Promise.all([
      prisma.quote.count({ where }),
      prisma.quote.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          client: { select: { name: true, type: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return reply.send(paginated(quotes, total, query.page, query.limit))
  })

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        client: true,
        items: { include: { product: { select: { name: true, emoji: true } } } },
        user: { select: { name: true }, include: { company: true } },
      },
    })
    if (!quote) throw new NotFoundError('Orçamento')
    return reply.send(success(quote))
  })

  app.post('/', async (request, reply) => {
    const body = quoteSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ success: false, message: 'Dados inválidos', errors: body.error.flatten() })

    const { id: userId } = request.user as { id: string }
    const { items, discountType, discountValue, ...rest } = body.data
    const { subtotal, total } = calcQuoteTotals(items, discountType, discountValue)

    const quote = await prisma.quote.create({
      data: {
        number: await getNextQuoteNumber(),
        userId,
        subtotal,
        total,
        discountType,
        discountValue,
        publicToken: uuid(),
        validUntil: rest.validUntil ? new Date(rest.validUntil) : undefined,
        ...rest,
        items: {
          create: items.map(item => ({
            ...item,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
      include: { items: true, client: { select: { name: true } } },
    })

    return reply.status(201).send(success(quote, 'Orçamento criado com sucesso'))
  })

  app.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = quoteSchema.partial().safeParse(request.body)
    if (!body.success) return reply.status(400).send({ success: false, message: 'Dados inválidos' })

    const existing = await prisma.quote.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Orçamento')
    if (existing.status !== 'DRAFT' && existing.status !== 'SENT') {
      throw new AppError('Apenas orçamentos em rascunho ou enviados podem ser editados', 400)
    }

    const { items, discountType, discountValue, ...rest } = body.data
    const updateData: Record<string, unknown> = { ...rest }

    if (items) {
      const { subtotal, total } = calcQuoteTotals(items, discountType, discountValue)
      updateData.subtotal = subtotal
      updateData.total = total
      updateData.discountType = discountType
      updateData.discountValue = discountValue
      await prisma.quoteItem.deleteMany({ where: { quoteId: id } })
      await prisma.quoteItem.createMany({
        data: items.map(item => ({ ...item, quoteId: id, totalPrice: item.quantity * item.unitPrice })),
      })
    }

    const quote = await prisma.quote.update({ where: { id }, data: updateData })
    return reply.send(success(quote, 'Orçamento atualizado'))
  })

  // PATCH /api/quotes/:id/status — alterar status
  app.patch('/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { status } = z.object({ status: z.nativeEnum(QuoteStatus) }).parse(request.body)

    const quote = await prisma.quote.update({ where: { id }, data: { status } }).catch(() => { throw new NotFoundError('Orçamento') })
    return reply.send(success(quote, `Status atualizado para ${status}`))
  })

  // POST /api/quotes/:id/convert — converter orçamento aprovado em pedido
  app.post('/:id/convert', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { id: userId } = request.user as { id: string }

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!quote) throw new NotFoundError('Orçamento')
    if (quote.status !== 'APPROVED') throw new AppError('Apenas orçamentos aprovados podem ser convertidos em pedido', 400)
    if (quote.order) throw new AppError('Este orçamento já foi convertido em pedido', 409)

    const lastOrder = await prisma.order.findFirst({ orderBy: { createdAt: 'desc' }, select: { number: true } })
    const nextNum = lastOrder ? parseInt(lastOrder.number.split('-')[1]) + 1 : 1
    const orderNumber = `PED-${String(nextNum).padStart(4, '0')}`

    const order = await prisma.order.create({
      data: {
        number: orderNumber,
        clientId: quote.clientId,
        userId,
        quoteId: id,
        status: OrderStatus.PENDING,
        subtotal: quote.subtotal,
        total: quote.total,
        items: {
          create: quote.items.map(item => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      },
    })

    return reply.status(201).send(success(order, 'Pedido criado a partir do orçamento'))
  })

  // POST /api/quotes/:id/duplicate
  app.post('/:id/duplicate', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { id: userId } = request.user as { id: string }

    const original = await prisma.quote.findUnique({ where: { id }, include: { items: true } })
    if (!original) throw new NotFoundError('Orçamento')

    const duplicate = await prisma.quote.create({
      data: {
        number: await getNextQuoteNumber(),
        clientId: original.clientId,
        userId,
        status: 'DRAFT',
        discountType: original.discountType,
        discountValue: original.discountValue,
        paymentMethod: original.paymentMethod,
        notes: original.notes,
        subtotal: original.subtotal,
        total: original.total,
        publicToken: uuid(),
        items: {
          create: original.items.map(item => ({
            productId: item.productId,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      },
    })

    return reply.status(201).send(success(duplicate, 'Orçamento duplicado com sucesso'))
  })
}
