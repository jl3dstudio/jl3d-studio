import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, Users, Phone, Mail } from 'lucide-react'
import api from '@/services/api'
import type { Client } from '@/types'
import { formatDate } from '@/utils/format'
import { CLIENT_TYPE_LABELS } from '@/utils/constants'
import Button from '@/components/ui/Button'
import { SkeletonRow } from '@/components/ui/Skeleton'

export default function ClientsPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => api.get<any>(`/clients?limit=50&search=${search}`).then(r => r.data.data || []),
  })

  const clients = (Array.isArray(data) ? data : []) as Client[]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="text-sm text-text-muted mt-0.5">{clients.length} clientes</p>
        </div>
        <Button icon={<Plus size={16} />}>Novo cliente</Button>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..." className="input-base pl-9" />
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="table-responsive">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Cliente</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Tipo</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Contato</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Pedidos</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <SkeletonRow count={8} />
            ) : clients.map(c => (
              <tr key={c.id} className="table-row cursor-pointer">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-brand-400">{c.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{c.name}</p>
                      {c.tags.length > 0 && (
                        <div className="flex gap-1 mt-0.5">
                          {c.tags.slice(0, 2).map(t => (
                            <span key={t} className="badge bg-bg-600 text-text-muted text-[10px] border-border">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="badge bg-bg-600 text-text-secondary border border-border text-xs">{CLIENT_TYPE_LABELS[c.type]}</span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="space-y-0.5">
                    {c.whatsapp && (
                      <div className="flex items-center gap-1.5 text-xs text-text-muted">
                        <Phone size={11} /> {c.whatsapp}
                      </div>
                    )}
                    {c.email && (
                      <div className="flex items-center gap-1.5 text-xs text-text-muted">
                        <Mail size={11} /> {c.email}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-sm font-mono text-text-primary">{c._count?.orders || 0}</span>
                </td>
                <td className="px-5 py-3.5 text-sm text-text-muted">{formatDate(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {!isLoading && clients.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users size={40} className="text-text-muted mb-3" />
            <p className="text-text-secondary">Nenhum cliente encontrado</p>
          </div>
        )}
      </div>
    </div>
  )
}
