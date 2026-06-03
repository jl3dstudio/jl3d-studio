import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '../utils/prisma'
import { authenticate } from '../middlewares/auth'
import { NotFoundError } from '../utils/errors'
import { success } from '../utils/response'

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
})

export default async function userRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate)

  // GET /api/users/me
  app.get('/me', async (request, reply) => {
    const { id } = request.user as { id: string }
    const user = await prisma.user.findUnique({
      where: { id },
      include: { company: true },
    })
    if (!user) throw new NotFoundError('Usuário')

    const { passwordHash: _, ...safeUser } = user
    return reply.send(success(safeUser))
  })

  // PATCH /api/users/me
  app.patch('/me', async (request, reply) => {
    const { id } = request.user as { id: string }
    const body = updateProfileSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ success: false, message: 'Dados inválidos' })

    const { name, email, currentPassword, newPassword } = body.data
    const updateData: Record<string, unknown> = {}

    if (name) updateData.name = name
    if (email) {
      const exists = await prisma.user.findFirst({ where: { email, NOT: { id } } })
      if (exists) return reply.status(409).send({ success: false, message: 'Email já cadastrado' })
      updateData.email = email
    }

    if (newPassword) {
      const user = await prisma.user.findUnique({ where: { id } })
      if (!user || !currentPassword || !await bcrypt.compare(currentPassword, user.passwordHash)) {
        return reply.status(400).send({ success: false, message: 'Senha atual incorreta' })
      }
      updateData.passwordHash = await bcrypt.hash(newPassword, 10)
    }

    const updated = await prisma.user.update({ where: { id }, data: updateData })
    const { passwordHash: _, ...safeUser } = updated
    return reply.send(success(safeUser, 'Perfil atualizado com sucesso'))
  })
}
