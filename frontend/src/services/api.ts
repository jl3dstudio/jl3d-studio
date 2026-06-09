// Cliente HTTP centralizado com interceptors de auth
import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Injeta token JWT em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jl3d_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Flag para evitar múltiplos redirects simultâneos
let isRedirecting = false

// Trata respostas e erros globalmente
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message || error.response?.data?.error

    if (status === 401 && !isRedirecting) {
      // Não tenta refresh na rota de login ou refresh
      const url = error.config?.url || ''
      if (url.includes('/auth/login') || url.includes('/auth/refresh')) {
        return Promise.reject(new Error(message || 'Credenciais inválidas'))
      }

      const refreshToken = localStorage.getItem('jl3d_refresh')
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken })
          localStorage.setItem('jl3d_token', data.data.accessToken)
          error.config.headers.Authorization = `Bearer ${data.data.accessToken}`
          return api.request(error.config)
        } catch {
          // refresh falhou
        }
      }

      // Limpa sessão e redireciona apenas uma vez
      isRedirecting = true
      localStorage.removeItem('jl3d_token')
      localStorage.removeItem('jl3d_refresh')
      setTimeout(() => { isRedirecting = false }, 3000)
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }

    if (status === 429) {
      toast.error('Muitas requisições. Aguarde um momento.')
    }

    return Promise.reject(new Error(message || 'Erro inesperado'))
  },
)

export default api
