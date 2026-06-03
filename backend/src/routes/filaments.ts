import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { authenticate } from '../middlewares/auth'
import { NotFoundError } from '../utils/errors'
import { success, paginated } from '../utils/response'
import { FilamentType } from '@prisma/client'

const filamentSchema = z.object({
  name: z.string().min(2),
  type: z.nativeEnum(FilamentType),
  brand: z.string().optional(),
  colorName: z.string(),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor hexadecimal inválida'),
  spoolWeightG: z.number().positive(),
  pricePaid: z.number().positive(),
  purchaseDate: z.string().optional(),
  currentWeightG: z.number().min(0),
  minStockG: z.number().min(0).default(100),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

const entrySchema = z.object({
  weightG: z.number().positive(),
  pricePaid: z.number().positive(),
  purchaseDate: z.string(),
  notes: z.string().optional(),
})

export default async function filamentRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate)

  // GET /api/filaments — listar com paginação e filtros
  app.get('/', async (request, reply) => {
    const query = z.object({
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(20),
      search: z.string().optional(),
      type: z.nativeEnum(FilamentType).optional(),
      lowStock: z.string().transform(v => v === 'true').optional(),
    }).parse(request.query)

    const where = {
      isActive: true,
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { brand: { contains: query.search, mode: 'insensitive' as const } },
          { colorName: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
      ...(query.type && { type: query.type }),
      ...(query.lowStock && { currentWeightG: { lte: prisma.filament.fields.minStockG } }),
    }

    // Busca filamentos com estoque baixo manualmente pois Prisma não suporta comparação de colunas diretamente
    if (query.lowStock) {
      const all = await prisma.filament.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      })
      const lowStockItems = all.filter(f => f.currentWeightG <= f.minStockG)
      return reply.send(success(lowStockItems))
    }

    const [total, filaments] = await Promise.all([
      prisma.filament.count({ where }),
      prisma.filament.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return reply.send(paginated(filaments, total, query.page, query.limit))
  })

  // GET /api/filaments/:id
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const filament = await prisma.filament.findUnique({
      where: { id },
      include: {
        entries: { orderBy: { createdAt: 'desc' }, take: 10 },
        _count: { select: { orderItems: true } },
      },
    })
    if (!filament) throw new NotFoundError('Filamento')
    return reply.send(success(filament))
  })

  // POST /api/filaments
  app.post('/', async (request, reply) => {
    const body = filamentSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ success: false, message: 'Dados inválidos', errors: body.error.flatten() })

    const data = {
      ...body.data,
      purchaseDate: body.data.purchaseDate ? new Date(body.data.purchaseDate) : undefined,
      tags: body.data.tags || [],
    }

    const filament = await prisma.filament.create({ data })
    return reply.status(201).send(success(filament, 'Filamento cadastrado com sucesso'))
  })

  // PUT /api/filaments/:id
  app.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = filamentSchema.partial().safeParse(request.body)
    if (!body.success) return reply.status(400).send({ success: false, message: 'Dados inválidos' })

    const data = {
      ...body.data,
      purchaseDate: body.data.purchaseDate ? new Date(body.data.purchaseDate) : undefined,
    }

    const filament = await prisma.filament.update({ where: { id }, data }).catch(() => { throw new NotFoundError('Filamento') })
    return reply.send(success(filament, 'Filamento atualizado'))
  })

  // DELETE /api/filaments/:id (arquivar)
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    await prisma.filament.update({ where: { id }, data: { isActive: false } }).catch(() => { throw new NotFoundError('Filamento') })
    return reply.send(success(null, 'Filamento arquivado'))
  })

  // POST /api/filaments/:id/entries — registrar entrada de estoque
  app.post('/:id/entries', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = entrySchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ success: false, message: 'Dados inválidos' })

    const filament = await prisma.filament.findUnique({ where: { id } })
    if (!filament) throw new NotFoundError('Filamento')

    const [entry] = await prisma.$transaction([
      prisma.filamentEntry.create({
        data: {
          filamentId: id,
          weightG: body.data.weightG,
          pricePaid: body.data.pricePaid,
          purchaseDate: new Date(body.data.purchaseDate),
          notes: body.data.notes,
        },
      }),
      prisma.filament.update({
        where: { id },
        data: { currentWeightG: { increment: body.data.weightG } },
      }),
    ])

    return reply.status(201).send(success(entry, `+${body.data.weightG}g adicionados ao estoque`))
  })
}
