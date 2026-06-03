import React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp, ShoppingBag, Users, Layers, AlertTriangle,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import api from '@/services/api'
import type { DashboardData } from '@/types'
import { formatCurrency, formatDate } from '@/utils/format'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/utils/constants'
import Badge from '@/components/ui/Badge'
import { SkeletonCard } from '@/components/ui/Skeleton'

const CHART_COLORS = ['#2563EB', '#22D3EE', '#4ADE80', '#FBBF24', '#F87171', '#A78BFA']

function KpiCard({
  label, value, icon: Icon, color, sub, trend,
}: {
  label: string
  value: string
  icon: React.ElementType
  color: string
  sub?: string
  trend?: number
}) {
  return (
    <div className="card hover:border-border-accent transition-colors duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="section-label">{label}</p>
          <p className="text-2xl font-bold text-text-primary mt-1.5 font-mono">{value}</p>
          {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon size={20} />
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
          {trend >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {Math.abs(trend).toFixed(1)}% vs mês anterior
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<{ data: DashboardData }>('/dashboard').then(r => r.data.data),
  })

  if (isLoading) {
    return (
      <div>
        <div className="mb-6">
          <div className="h-7 w-48 skeleton rounded mb-1" />
          <div className="h-4 w-64 skeleton rounded" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          <SkeletonCard count={5} />
        </div>
      </div>
    )
  }

  if (!data) return null

  const { kpis, charts, alerts, recentOrders } = data

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-muted mt-0.5">Visão geral do negócio</p>
      </div>

      {/* Alertas */}
      {alerts.lowStockFilaments.length > 0 && (
        <div className="mb-5 p-4 rounded-xl bg-amber-400/5 border border-amber-400/20 flex items-center gap-3">
          <AlertTriangle size={18} className="text-warning flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-warning">Estoque baixo detectado</p>
            <p className="text-xs text-text-muted mt-0.5">
              {alerts.lowStockFilaments.map(f => f.name).join(', ')} — reposição necessária
            </p>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-7">
        <KpiCard
          label="Receita do mês"
          value={formatCurrency(kpis.monthRevenue)}
          icon={TrendingUp}
          color="bg-brand-500/10 text-brand-400"
        />
        <KpiCard
          label="Pedidos ativos"
          value={String(kpis.activeOrders)}
          icon={ShoppingBag}
          color="bg-cyan-400/10 text-cyan-400"
          sub="em andamento"
        />
        <KpiCard
          label="Lucro estimado"
          value={formatCurrency(kpis.profitEstimate)}
          icon={TrendingUp}
          color={kpis.profitPercent >= 0 ? 'bg-green-400/10 text-success' : 'bg-red-400/10 text-danger'}
          sub={`${kpis.profitPercent.toFixed(1)}% de margem`}
        />
        <KpiCard
          label="Clientes ativos"
          value={String(kpis.activeClients)}
          icon={Users}
          color="bg-purple-400/10 text-purple-400"
        />
        <KpiCard
          label="Estoque baixo"
          value={String(kpis.lowStockCount)}
          icon={Layers}
          color={kpis.lowStockCount > 0 ? 'bg-amber-400/10 text-warning' : 'bg-bg-500 text-text-muted'}
          sub={kpis.lowStockCount > 0 ? 'filamentos críticos' : 'tudo OK'}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        {/* Receita 6 meses */}
        <div className="xl:col-span-2 card">
          <p className="text-sm font-semibold text-text-primary mb-4">Receita — últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={charts.revenueByMonth}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A3347" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1C2333', border: '1px solid #2A3347', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#F1F5F9' }}
                formatter={(v: number) => [formatCurrency(v), 'Receita']}
              />
              <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pedidos por status */}
        <div className="card">
          <p className="text-sm font-semibold text-text-primary mb-4">Pedidos por status</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={charts.ordersByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3}>
                {charts.ordersByStatus.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1C2333', border: '1px solid #2A3347', borderRadius: 8, fontSize: 12 }}
                formatter={(v, _, p) => [v, ORDER_STATUS_LABELS[p.payload.status as keyof typeof ORDER_STATUS_LABELS]]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {charts.ordersByStatus.slice(0, 4).map((item, i) => (
              <div key={item.status} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-text-secondary">{ORDER_STATUS_LABELS[item.status]}</span>
                </div>
                <span className="font-mono text-text-primary">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Top produtos */}
        <div className="card">
          <p className="text-sm font-semibold text-text-primary mb-4">Top 5 produtos</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={charts.topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#2A3347" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => formatCurrency(v)} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1C2333', border: '1px solid #2A3347', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [formatCurrency(v), 'Receita']}
              />
              <Bar dataKey="revenue" fill="#2563EB" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Últimos pedidos */}
        <div className="card">
          <p className="text-sm font-semibold text-text-primary mb-4">Últimos pedidos</p>
          <div className="space-y-2">
            {recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-text-primary font-mono">{order.number}</p>
                  <p className="text-xs text-text-muted">{order.client?.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge text-xs ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <span className="text-sm font-mono text-text-primary">{formatCurrency(order.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
