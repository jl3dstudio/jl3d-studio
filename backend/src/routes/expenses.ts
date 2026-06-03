import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { authenticate } from '../middlewares/auth'
import { NotFoundError } from '../utils/errors'
import { success, paginated } from '../utils/response'
import { ExpenseCategory } from '@prisma/client'

const expenseSchema = z.object({
  category: z.nativeEnum(ExpenseCategory),
  description: z.string().min(2),
  amount: z.number().positive(),
  date: z.string(),
  notes: z.string().optional(),
})

export default async function expenseRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate)

  app.get('/', async (request, reply) => {
    const query = z.object({
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(20),
      category: z.nativeEnum(ExpenseCategory).optional(),
      from: z.string().optional(),
      to: z.string().optional(),
    }).parse(request.query)

    const where = {
      ...(query.category && { category: query.category }),
      ...(query.from && query.to && {
        date: { gte: new Date(query.from), lte: new Date(query.to) },
      }),
    }

    const [total, expenses] = await Promise.all([
      prisma.expense.count({ where }),
      prisma.expense.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { date: 'desc' },
      }),
    ])

    return reply.send(paginated(expenses, total, query.page, query.limit))
  })

  app.post('/', async (request, reply) => {
    const body = expenseSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ success: false, message: 'Dados inválidos' })

    const expense = await prisma.expense.create({
      data: { ...body.data, date: new Date(body.data.date) },
    })
    return reply.status(201).send(success(expense, 'Despesa registrada'))
  })

  app.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = expenseSchema.partial().safeParse(request.body)
    if (!body.success) return reply.status(400).send({ success: false, message: 'Dados inválidos' })

    const expense = await prisma.expense.update({
      where: { id },
      data: { ...body.data, date: body.data.date ? new Date(body.data.date) : undefined },
    }).catch(() => { throw new NotFoundError('Despesa') })
    return reply.send(success(expense, 'Despesa atualizada'))
  })

  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    await prisma.expense.delete({ where: { id } }).catch(() => { throw new NotFoundError('Despesa') })
    return reply.send(success(null, 'Despesa removida'))
  })
}
