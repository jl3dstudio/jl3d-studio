import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { authenticate } from '../middlewares/auth'
import { NotFoundError } from '../utils/errors'
import { success } from '../utils/response'

const printerSchema = z.object({
  name: z.string().min(2),
  model: z.string().optional(),
  powerWatts: z.number().positive(),
  purchaseValue: z.number().positive(),
  usefulLifeHours: z.number().positive(),
  notes: z.string().optional(),
})

export default async function printerRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate)

  app.get('/', async (_request, reply) => {
    const printers = await prisma.printer.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    })
    return reply.send(success(printers))
  })

  app.post('/', async (request, reply) => {
    const body = printerSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ success: false, message: 'Dados inválidos', errors: body.error.flatten() })

    const printer = await prisma.printer.create({ data: body.data })
    return reply.status(201).send(success(printer, 'Impressora cadastrada com sucesso'))
  })

  app.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = printerSchema.partial().safeParse(request.body)
    if (!body.success) return reply.status(400).send({ success: false, message: 'Dados inválidos' })

    const printer = await prisma.printer.update({ where: { id }, data: body.data }).catch(() => { throw new NotFoundError('Impressora') })
    return reply.send(success(printer, 'Impressora atualizada'))
  })

  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    await prisma.printer.update({ where: { id }, data: { isActive: false } }).catch(() => { throw new NotFoundError('Impressora') })
    return reply.send(success(null, 'Impressora removida'))
  })
}
