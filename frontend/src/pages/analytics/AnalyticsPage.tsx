import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import api from '@/services/api'
import type { DashboardData } from '@/types'
import { formatCurrency } from '@/utils/format'
import { ORDER_STATUS_LABELS } from '@/utils/constants'
import { SkeletonCard } from '@/components/ui/Skeleton'

const COLORS = ['#2563EB', '#22D3EE', '#4ADE80', '#FBBF24', '#F87171', '#A78BFA']

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<{ data: DashboardData }>('/dashboard').then(r => r.data.data),
  })

  if (isLoading) return <div className="grid grid-cols-2 gap-5"><SkeletonCard count={4} /></div>
  if (!data) return null

  return (
    <div className="animate-fade-in">
      <div className="mb-7">
        <h1 className="page-title">Analytics</h1>
        <p className="text-sm text-text-muted mt-0.5">Métricas e relatórios do negócio</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Receita mensal */}
        <div className="card">
          <p className="text-sm font-semibold text-text-primary mb-4">Receita mensal (R$)</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.charts.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A3347" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#1C2333', border: '1px solid #2A3347', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [formatCurrency(v), 'Receita']} />
              <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2.5} dot={{ fill: '#2563EB', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top produtos */}
        <div className="card">
          <p className="text-sm font-semibold text-text-primary mb-4">Receita por produto</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.charts.topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#2A3347" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => formatCurrency(v)} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1C2333', border: '1px solid #2A3347', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [formatCurrency(v), 'Receita']} />
              <Bar dataKey="revenue" fill="#2563EB" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status dos pedidos */}
        <div className="card">
          <p className="text-sm font-semibold text-text-primary mb-4">Distribuição por status</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.charts.ordersByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} paddingAngle={3}>
                {data.charts.ordersByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1C2333', border: '1px solid #2A3347', borderRadius: 8, fontSize: 12 }} formatter={(v, _, p) => [v, ORDER_STATUS_LABELS[p.payload.status]]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Materiais */}
        <div className="card">
          <p className="text-sm font-semibold text-text-primary mb-4">Distribuição de materiais</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.charts.materialDistribution} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} paddingAngle={3}>
                {data.charts.materialDistribution.map((entry, i) => <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1C2333', border: '1px solid #2A3347', borderRadius: 8, fontSize: 12 }} />
              <Legend formatter={(v) => <span style={{ color: '#94A3B8', fontSize: 12 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
