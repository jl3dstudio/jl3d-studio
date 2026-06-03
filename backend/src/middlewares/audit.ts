// Middleware de auditoria — registra ações importantes
import { FastifyRequest } from 'fastify'
import { prisma } from '../utils/prisma'

export async function auditLog(
  userId: string | null,
  action: string,
  entity: string,
  entityId?: string,
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>,
  request?: FastifyRequest,
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        oldValues: oldValues ?? undefined,
        newValues: newValues ?? undefined,
        ipAddress: request?.ip,
        userAgent: request?.headers['user-agent'],
      },
    })
  } catch {
    // Não deixar falha de auditoria derrubar a requisição principal
    console.error(`Falha ao registrar auditoria: ${action} em ${entity}`)
  }
}
