import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '../utils/prisma'
import { authenticate, requireAdmin } from '../middlewares/auth'
import { NotFoundError } from '../utils/errors'
import { success } from '../utils/response'
import { v4 as uuid } from 'uuid'

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
})

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'OPERATOR']).default('OPERATOR'),
})

export default async function userRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate)

  // ── Rotas Admin ──────────────────────────────────────────────────────────

  // GET /api/users — lista todos os usuários (admin)
  app.get('/', async (request, reply) => {
    await requireAdmin(request, reply)
    if (reply.sent) return
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    })
    return reply.send(success(users))
  })

  // POST /api/users — criar usuário (admin)
  app.post('/', async (request, reply) => {
    await requireAdmin(request, reply)
    if (reply.sent) return
    const body = createUserSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ success: false, message: 'Dados inválidos', errors: body.error.flatten() })

    const { name, email, password, role } = body.data
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return reply.status(409).send({ success: false, message: 'Email já cadastrado' })

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { id: uuid(), name, email, passwordHash, role },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    })
    return reply.status(201).send(success(user, 'Usuário criado com sucesso'))
  })

  // PATCH /api/users/:id — ativar/desativar usuário (admin)
  app.patch('/:id', async (request, reply) => {
    await requireAdmin(request, reply)
    if (reply.sent) return
    const { id } = request.params as { id: string }
    const { isActive } = request.body as { isActive: boolean }
    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    })
    return reply.send(success(user, 'Usuário atualizado'))
  })

  // DELETE /api/users/:id — remover usuário (admin)
  app.delete('/:id', async (request, reply) => {
    await requireAdmin(request, reply)
    if (reply.sent) return
    const { id } = request.params as { id: string }
    const reqUser = request.user as { id: string }
    if (id === reqUser.id) return reply.status(400).send({ success: false, message: 'Não é possível remover seu próprio usuário' })
    await prisma.user.delete({ where: { id } })
    return reply.send(success(null, 'Usuário removido'))
  })

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
