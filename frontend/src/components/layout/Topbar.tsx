import React from 'react'
import { Bell, AlertTriangle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import type { DashboardData } from '@/types'
import { useAuthStore } from '@/stores/authStore'

interface TopbarProps {
  sidebarCollapsed: boolean
}

export default function Topbar({ sidebarCollapsed }: TopbarProps) {
  const { user } = useAuthStore()

  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<{ data: DashboardData }>('/dashboard').then(r => r.data.data),
    staleTime: 1000 * 60 * 5,
  })

  const lowStockCount = data?.kpis.lowStockCount || 0

  return (
    <header
      className="fixed top-0 right-0 z-30 h-16 bg-bg-900/80 backdrop-blur-md border-b border-border flex items-center px-6 gap-4 transition-all duration-300"
      style={{ left: sidebarCollapsed ? '64px' : '240px' }}
    >
      {/* Espaço flexível */}
      <div className="flex-1" />

      {/* Alertas de estoque baixo */}
      {lowStockCount > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20 text-warning text-xs font-medium">
          <AlertTriangle size={13} />
          {lowStockCount} filamento{lowStockCount > 1 ? 's' : ''} com estoque baixo
        </div>
      )}

      {/* Notificações */}
      <button className="relative p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-700 transition-colors">
        <Bell size={18} />
      </button>

      {/* Avatar */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
          <span className="text-sm font-semibold text-brand-400">
            {user?.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-text-primary leading-none">{user?.name}</p>
          <p className="text-[11px] text-text-muted">{user?.company?.name || 'JL3D Studio'}</p>
        </div>
      </div>
    </header>
  )
}
