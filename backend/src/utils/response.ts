// Helpers para respostas padronizadas da API
export function success<T>(data: T, message?: string) {
  return { success: true, message, data }
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
) {
  return {
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}
