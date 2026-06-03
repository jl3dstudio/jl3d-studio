// Store de autenticação com Zustand
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string, refreshToken: string) => void
  updateUser: (user: Partial<User>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token, refreshToken) => {
        localStorage.setItem('jl3d_token', token)
        localStorage.setItem('jl3d_refresh', refreshToken)
        set({ user, token, isAuthenticated: true })
      },

      updateUser: (partial) =>
        set((state) => ({ user: state.user ? { ...state.user, ...partial } : null })),

      logout: () => {
        localStorage.removeItem('jl3d_token')
        localStorage.removeItem('jl3d_refresh')
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: 'jl3d_auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    },
  ),
)
