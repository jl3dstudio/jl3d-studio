// Classes de erro customizadas para respostas padronizadas
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public code?: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string) {
    super(`${entity} não encontrado(a)`, 404, 'NOT_FOUND')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Não autorizado') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acesso negado') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
  }
}

// Formata resposta de erro padronizada
export function formatError(error: unknown) {
  if (error instanceof AppError) {
    return { success: false, message: error.message, code: error.code }
  }
  console.error('Erro não tratado:', error)
  return { success: false, message: 'Erro interno do servidor', code: 'INTERNAL_ERROR' }
}
