// Cliente HTTP centralizado com interceptors de auth
import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Injeta token JWT em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jl3d_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Trata respostas e erros globalmente
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message

    if (status === 401) {
      // Tenta renovar o token
      const refreshToken = localStorage.getItem('jl3d_refresh')
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken })
          localStorage.setItem('jl3d_token', data.data.accessToken)
          error.config.headers.Authorization = `Bearer ${data.data.accessToken}`
          return api.request(error.config)
        } catch {
          localStorage.removeItem('jl3d_token')
          localStorage.removeItem('jl3d_refresh')
          window.location.href = '/login'
        }
      } else {
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
