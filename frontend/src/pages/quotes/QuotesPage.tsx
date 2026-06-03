import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, FileText } from 'lucide-react'
import api from '@/services/api'
import type { Quote } from '@/types'
import { formatCurrency, formatDate } from '@/utils/format'
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS } from '@/utils/constants'
import Button from '@/components/ui/Button'
import { SkeletonRow } from '@/components/ui/Skeleton'

export default function QuotesPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['quotes', search],
    queryFn: () => api.get<any>(`/quotes?limit=50&search=${search}`).then(r => r.data.data || []),
  })

  const quotes = (Array.isArray(data) ? data : []) as Quote[]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Orçamentos</h1>
          <p className="text-sm text-text-muted mt-0.5">{quotes.length} orçamentos</p>
        </div>
        <Button icon={<Plus size={16} />}>Novo orçamento</Button>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar orçamento..." className="input-base pl-9" />
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Número</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Cliente</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Total</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Data</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <SkeletonRow count={6} /> : quotes.map(q => (
              <tr key={q.id} className="table-row cursor-pointer">
                <td className="px-5 py-3.5">
                  <span className="font-mono text-sm font-medium text-text-primary">{q.number}</span>
                </td>
                <td className="px-5 py-3.5 text-sm text-text-secondary">{(q as any).client?.name}</td>
                <td className="px-5 py-3.5">
                  <span className={`badge ${QUOTE_STATUS_COLORS[q.status]}`}>{QUOTE_STATUS_LABELS[q.status]}</span>
                </td>
                <td className="px-5 py-3.5 font-mono text-sm text-text-primary">{formatCurrency(q.total)}</td>
                <td className="px-5 py-3.5 text-sm text-text-muted">{formatDate(q.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && quotes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText size={40} className="text-text-muted mb-3" />
            <p className="text-text-secondary">Nenhum orçamento encontrado</p>
          </div>
        )}
      </div>
    </div>
  )
}
