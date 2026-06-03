import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { authenticate } from '../middlewares/auth'
import { NotFoundError } from '../utils/errors'
import { success, paginated } from '../utils/response'

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  emoji: z.string().optional(),
  filamentId: z.string().uuid().optional(),
  weightG: z.number().positive(),
  printTimeMin: z.number().int().positive(),
  laborTimeMin: z.number().int().min(0).default(0),
  postProcessCost: z.number().min(0).default(0),
  baseCost: z.number().positive(),
  suggestedPrice: z.number().positive(),
  marginPercent: z.number().min(0),
  tags: z.array(z.string()).optional(),
})

export default async function productRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate)

  app.get('/', async (request, reply) => {
    const query = z.object({
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(20),
      search: z.string().optional(),
      filamentId: z.string().optional(),
      tag: z.string().optional(),
    }).parse(request.query)

    const where = {
      isActive: true,
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { description: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
      ...(query.filamentId && { filamentId: query.filamentId }),
      ...(query.tag && { tags: { has: query.tag } }),
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: { filament: { select: { name: true, colorHex: true, colorName: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return reply.send(paginated(products, total, query.page, query.limit))
  })

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const product = await prisma.product.findUnique({
      where: { id },
      include: { filament: true },
    })
    if (!product) throw new NotFoundError('Produto')
    return reply.send(success(product))
  })

  app.post('/', async (request, reply) => {
    const body = productSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ success: false, message: 'Dados inválidos', errors: body.error.flatten() })

    const product = await prisma.product.create({ data: { ...body.data, tags: body.data.tags || [] } })
    return reply.status(201).send(success(product, 'Produto criado com sucesso'))
  })

  app.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = productSchema.partial().safeParse(request.body)
    if (!body.success) return reply.status(400).send({ success: false, message: 'Dados inválidos' })

    const product = await prisma.product.update({ where: { id }, data: body.data }).catch(() => { throw new NotFoundError('Produto') })
    return reply.send(success(product, 'Produto atualizado'))
  })

  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    await prisma.product.update({ where: { id }, data: { isActive: false } }).catch(() => { throw new NotFoundError('Produto') })
    return reply.send(success(null, 'Produto arquivado'))
  })
}
