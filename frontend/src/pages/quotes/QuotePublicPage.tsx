import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Printer, FileText } from 'lucide-react'
import api from '@/services/api'
import type { Quote } from '@/types'
import { formatCurrency, formatDate } from '@/utils/format'
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS } from '@/utils/constants'

export default function QuotePublicPage() {
  const { token } = useParams<{ token: string }>()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['quote-public', token],
    queryFn: () => api.get<{ data: Quote }>(`/quotes/public/${token}`).then(r => r.data.data),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-900 flex items-center justify-center">
        <div className="text-text-muted">Carregando orçamento...</div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-bg-900 flex items-center justify-center">
        <div className="text-center">
          <FileText size={40} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-primary font-medium">Orçamento não encontrado</p>
          <p className="text-text-muted text-sm mt-1">O link pode ter expirado ou ser inválido.</p>
        </div>
      </div>
    )
  }

  const company = (data as any).user?.company

  return (
    <div className="min-h-screen bg-bg-900 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Cabeçalho da empresa */}
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
                <Printer size={18} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-text-primary">{company?.name || 'JL3D Studio'}</p>
                {company?.slogan && <p className="text-xs text-text-muted">{company.slogan}</p>}
              </div>
            </div>
            <span className={`badge ${QUOTE_STATUS_COLORS[data.status]}`}>
              {QUOTE_STATUS_LABELS[data.status]}
            </span>
          </div>
        </div>

        {/* Dados do orçamento */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
            <div>
              <p className="section-label">Orçamento</p>
              <p className="text-xl font-bold font-mono text-text-primary">{data.number}</p>
            </div>
            <div className="text-right">
              <p className="section-label">Data</p>
              <p className="text-sm text-text-primary">{formatDate(data.createdAt)}</p>
              {data.validUntil && (
                <>
                  <p className="section-label mt-2">Válido até</p>
                  <p className="text-sm text-text-primary">{formatDate(data.validUntil)}</p>
                </>
              )}
            </div>
          </div>

          {/* Cliente */}
          <div className="mb-4">
            <p className="section-label mb-1">Para</p>
            <p className="font-medium text-text-primary">{(data as any).client?.name}</p>
            {(data as any).client?.email && <p className="text-sm text-text-muted">{(data as any).client.email}</p>}
          </div>

          {/* Itens */}
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-text-muted font-medium">Item</th>
                <th className="text-center py-2 text-text-muted font-medium">Qtd</th>
                <th className="text-right py-2 text-text-muted font-medium">Unit.</th>
                <th className="text-right py-2 text-text-muted font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map(item => (
                <tr key={item.id} className="border-b border-border/50">
                  <td className="py-2.5 text-text-primary">{item.name}</td>
                  <td className="py-2.5 text-center text-text-secondary">{item.quantity}</td>
                  <td className="py-2.5 text-right font-mono text-text-secondary">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-2.5 text-right font-mono text-text-primary font-medium">{formatCurrency(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totais */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-text-secondary">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(data.subtotal)}</span>
            </div>
            {data.discountValue > 0 && (
              <div className="flex justify-between text-success">
                <span>Desconto {data.discountType === 'PERCENT' ? `(${data.discountValue}%)` : ''}</span>
                <span className="font-mono">- {formatCurrency(data.discountType === 'PERCENT' ? data.subtotal * data.discountValue / 100 : data.discountValue)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-text-primary pt-2 border-t border-border">
              <span>Total</span>
              <span className="font-mono text-brand-400">{formatCurrency(data.total)}</span>
            </div>
          </div>

          {data.paymentMethod && (
            <p className="mt-3 text-xs text-text-muted">Forma de pagamento sugerida: <span className="text-text-secondary">{data.paymentMethod}</span></p>
          )}
          {data.notes && (
            <div className="mt-4 p-3 rounded-lg bg-bg-800 border border-border">
              <p className="text-xs text-text-muted mb-1">Observações</p>
              <p className="text-sm text-text-secondary">{data.notes}</p>
            </div>
          )}
        </div>

        {/* Contato */}
        {company && (
          <div className="text-center text-xs text-text-muted space-y-1">
            {company.whatsapp && <p>WhatsApp: {company.whatsapp}</p>}
            {company.email && <p>Email: {company.email}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
