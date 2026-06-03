import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { List, LayoutGrid, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/services/api'
import type { Order, OrderStatus } from '@/types'
import { formatCurrency, formatDate } from '@/utils/format'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_STATUS_EMOJI } from '@/utils/constants'
import Button from '@/components/ui/Button'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { cn } from '@/utils/cn'

const KANBAN_COLUMNS: OrderStatus[] = ['PENDING', 'PRINTING', 'POST_PROCESS', 'READY', 'DELIVERED']

export default function OrdersPage() {
  const [view, setView] = useState<'list' | 'kanban'>('kanban')
  const qc = useQueryClient()

  const { data: kanbanData, isLoading } = useQuery({
    queryKey: ['orders-kanban'],
    queryFn: () => api.get<{ data: Record<OrderStatus, Order[]> }>('/orders/kanban').then(r => r.data.data),
  })

  const { data: listData } = useQuery({
    queryKey: ['orders-list'],
    queryFn: () => api.get<any>('/orders?limit=50').then(r => r.data.data || []),
    enabled: view === 'list',
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders-kanban'] })
      toast.success('Status atualizado')
    },
  })

  const orders = (Array.isArray(listData) ? listData : []) as Order[]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pedidos</h1>
          <p className="text-sm text-text-muted mt-0.5">Gestão de produção</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-bg-700 border border-border rounded-lg p-0.5">
            <button
              onClick={() => setView('kanban')}
              className={cn('p-1.5 rounded-md transition-colors', view === 'kanban' ? 'bg-brand-500 text-white' : 'text-text-muted hover:text-text-primary')}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setView('list')}
              className={cn('p-1.5 rounded-md transition-colors', view === 'list' ? 'bg-brand-500 text-white' : 'text-text-muted hover:text-text-primary')}
            >
              <List size={15} />
            </button>
          </div>
          <Button icon={<ShoppingBag size={16} />}>Novo pedido</Button>
        </div>
      </div>

      {/* Kanban */}
      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map(status => {
            const columnOrders = kanbanData?.[status] || []
            return (
              <div key={status} className="flex-shrink-0 w-64">
                <div className="flex items-center gap-2 mb-3">
                  <span>{ORDER_STATUS_EMOJI[status]}</span>
                  <span className="text-sm font-medium text-text-primary">{ORDER_STATUS_LABELS[status]}</span>
                  <span className="ml-auto badge bg-bg-600 text-text-muted border border-border text-[10px]">{columnOrders.length}</span>
                </div>
                <div className="space-y-2.5 min-h-24">
                  {isLoading ? (
                    <SkeletonCard count={2} />
                  ) : columnOrders.map((order: Order) => (
                    <div key={order.id} className="card cursor-pointer hover:border-border-accent transition-colors p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-semibold text-brand-400">{order.number}</span>
                        <span className="text-xs text-text-muted">{formatDate(order.createdAt)}</span>
                      </div>
                      <p className="text-sm font-medium text-text-primary mb-1">{(order as any).client?.name}</p>
                      <p className="text-xs text-text-muted mb-2">{(order as any)._count?.items || 0} item(s)</p>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-bold text-text-primary">{formatCurrency(order.total)}</span>
                        {/* Botão de avançar status */}
                        {status !== 'DELIVERED' && (
                          <button
                            onClick={() => {
                              const nextStatus = KANBAN_COLUMNS[KANBAN_COLUMNS.indexOf(status) + 1]
                              if (nextStatus) statusMutation.mutate({ id: order.id, status: nextStatus })
                            }}
                            className="text-[10px] px-2 py-1 rounded-md bg-brand-500/10 text-brand-400 border border-brand-500/20 hover:bg-brand-500/20 transition-colors"
                          >
                            Avançar →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lista */}
      {view === 'list' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Pedido</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Cliente</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Total</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Data</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="table-row cursor-pointer">
                  <td className="px-5 py-3.5 font-mono text-sm font-medium text-text-primary">{o.number}</td>
                  <td className="px-5 py-3.5 text-sm text-text-secondary">{(o as any).client?.name}</td>
                  <td className="px-5 py-3.5">
                    <span className={`badge ${ORDER_STATUS_COLORS[o.status]}`}>{ORDER_STATUS_EMOJI[o.status]} {ORDER_STATUS_LABELS[o.status]}</span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-sm text-text-primary">{formatCurrency(o.total)}</td>
                  <td className="px-5 py-3.5 text-sm text-text-muted">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
