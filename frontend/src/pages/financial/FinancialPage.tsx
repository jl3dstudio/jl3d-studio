import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Plus } from 'lucide-react'
import api from '@/services/api'
import type { Revenue, Expense } from '@/types'
import { formatCurrency, formatDate } from '@/utils/format'
import { EXPENSE_CATEGORY_LABELS, PAYMENT_STATUS_COLORS, PAYMENT_STATUS_LABELS } from '@/utils/constants'
import Button from '@/components/ui/Button'
import { SkeletonRow } from '@/components/ui/Skeleton'

export default function FinancialPage() {
  const [tab, setTab] = useState<'overview' | 'revenues' | 'expenses'>('overview')

  const { data: revenues, isLoading: loadingRevenues } = useQuery({
    queryKey: ['revenues'],
    queryFn: () => api.get<any>('/revenues?limit=50').then(r => r.data.data || []),
  })

  const { data: expenses, isLoading: loadingExpenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => api.get<any>('/expenses?limit=50').then(r => r.data.data || []),
  })

  const totalRevenue = ((revenues || []) as Revenue[]).filter(r => r.status === 'RECEIVED').reduce((a, r) => a + r.amount, 0)
  const totalExpenses = ((expenses || []) as Expense[]).reduce((a, e) => a + e.amount, 0)
  const profit = totalRevenue - totalExpenses

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Financeiro</h1>
          <p className="text-sm text-text-muted mt-0.5">Controle de receitas e despesas</p>
        </div>
        <Button icon={<Plus size={16} />}>Registrar</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-success" />
            <span className="section-label">Receitas recebidas</span>
          </div>
          <p className="text-2xl font-bold font-mono text-success">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={16} className="text-danger" />
            <span className="section-label">Despesas</span>
          </div>
          <p className="text-2xl font-bold font-mono text-danger">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className={profit >= 0 ? 'text-success' : 'text-danger'} />
            <span className="section-label">Lucro líquido</span>
          </div>
          <p className={`text-2xl font-bold font-mono ${profit >= 0 ? 'text-success' : 'text-danger'}`}>
            {formatCurrency(profit)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-bg-700 border border-border rounded-lg w-fit mb-6">
        {(['overview', 'revenues', 'expenses'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-brand-500 text-white' : 'text-text-muted hover:text-text-primary'}`}>
            {t === 'overview' ? 'Visão geral' : t === 'revenues' ? 'Receitas' : 'Despesas'}
          </button>
        ))}
      </div>

      {/* Receitas */}
      {tab === 'revenues' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Descrição</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Forma</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Valor</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Data</th>
              </tr>
            </thead>
            <tbody>
              {loadingRevenues ? <SkeletonRow count={5} /> : ((revenues || []) as Revenue[]).map(r => (
                <tr key={r.id} className="table-row">
                  <td className="px-5 py-3.5 text-sm text-text-primary">{r.description}</td>
                  <td className="px-5 py-3.5 text-sm text-text-secondary">{r.paymentMethod || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`badge ${PAYMENT_STATUS_COLORS[r.status]}`}>{PAYMENT_STATUS_LABELS[r.status]}</span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-sm text-success">{formatCurrency(r.amount)}</td>
                  <td className="px-5 py-3.5 text-sm text-text-muted">{r.paidAt ? formatDate(r.paidAt) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Despesas */}
      {tab === 'expenses' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Descrição</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Categoria</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Valor</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Data</th>
              </tr>
            </thead>
            <tbody>
              {loadingExpenses ? <SkeletonRow count={5} /> : ((expenses || []) as Expense[]).map(e => (
                <tr key={e.id} className="table-row">
                  <td className="px-5 py-3.5 text-sm text-text-primary">{e.description}</td>
                  <td className="px-5 py-3.5">
                    <span className="badge bg-bg-600 text-text-secondary border border-border text-xs">{EXPENSE_CATEGORY_LABELS[e.category]}</span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-sm text-danger">{formatCurrency(e.amount)}</td>
                  <td className="px-5 py-3.5 text-sm text-text-muted">{formatDate(e.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
