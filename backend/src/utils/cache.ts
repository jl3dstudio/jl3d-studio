// Cache simples em memória — substitui Redis para o caso de uso atual
const store = new Map<string, { value: unknown; expiresAt: number }>()

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const item = store.get(key)
    if (!item) return null
    if (Date.now() > item.expiresAt) { store.delete(key); return null }
    return item.value as T
  },
  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
  },
  async del(key: string): Promise<void> {
    store.delete(key)
  },
  async flush(): Promise<void> {
    store.clear()
  },
}
