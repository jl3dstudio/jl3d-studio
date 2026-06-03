import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { authenticate } from '../middlewares/auth'
import { success } from '../utils/response'

export default async function settingsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate)

  app.get('/', async (_request, reply) => {
    const settings = await prisma.settings.findMany()
    const map = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>)
    return reply.send(success(map))
  })

  app.put('/', async (request, reply) => {
    const body = z.record(z.string()).safeParse(request.body)
    if (!body.success) return reply.status(400).send({ success: false, message: 'Dados inválidos' })

    await Promise.all(
      Object.entries(body.data).map(([key, value]) =>
        prisma.settings.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      )
    )

    const updated = await prisma.settings.findMany()
    const map = updated.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>)
    return reply.send(success(map, 'Configurações salvas'))
  })
}
