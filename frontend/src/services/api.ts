// Cliente HTTP centralizado com interceptors de auth
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/stores/authStore'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Injeta token JWT em todas as requisições
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token || localStorage.getItem('jl3d_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Flag para evitar múltiplos logouts simultâneos
let isLoggingOut = false

// Trata respostas e erros globalmente
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message || error.response?.data?.error

    if (status === 401) {
      const url = error.config?.url || ''

      // Não tenta refresh nas rotas de auth
      if (url.includes('/auth/login') || url.includes('/auth/refresh')) {
        return Promise.reject(new Error(message || 'Credenciais inválidas'))
      }

      // Tenta renovar o token
      const refreshToken = localStorage.getItem('jl3d_refresh')
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken })
          const newToken = data.data.accessToken
          localStorage.setItem('jl3d_token', newToken)
          useAuthStore.getState().setAuth(
            useAuthStore.getState().user!,
            newToken,
            refreshToken,
          )
          error.config.headers.Authorization = `Bearer ${newToken}`
          return api.request(error.config)
        } catch {
          // refresh falhou — faz logout completo
        }
      }

      // Logout completo via store (limpa Zustand + localStorage)
      if (!isLoggingOut) {
        isLoggingOut = true
        useAuthStore.getState().logout()
        setTimeout(() => { isLoggingOut = false }, 3000)
      }
    }

    if (status === 429) {
      toast.error('Muitas requisições. Aguarde um momento.')
    }

    return Promise.reject(new Error(message || 'Erro inesperado'))
  },
)

export default api
