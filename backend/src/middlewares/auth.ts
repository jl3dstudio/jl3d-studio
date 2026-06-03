// Middleware de autenticação JWT para rotas protegidas
import { FastifyRequest, FastifyReply } from 'fastify'
import { UnauthorizedError } from '../utils/errors'
import { prisma } from '../utils/prisma'

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
    const payload = request.user as { id: string; role: string }
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, role: true, isActive: true },
    })
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Usuário inativo ou não encontrado')
    }
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return reply.status(401).send({ success: false, message: err.message })
    }
    return reply.status(401).send({ success: false, message: 'Token inválido ou expirado' })
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const payload = request.user as { id: string; role: string }
  if (payload.role !== 'ADMIN') {
    return reply.status(403).send({ success: false, message: 'Apenas administradores podem acessar este recurso' })
  }
}
