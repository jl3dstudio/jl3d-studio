import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, Package } from 'lucide-react'
import api from '@/services/api'
import type { Product } from '@/types'
import { formatCurrency, formatDuration, formatPercent } from '@/utils/format'
import Button from '@/components/ui/Button'
import { SkeletonCard } from '@/components/ui/Skeleton'

export default function ProductsPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => api.get<{ data: Product[] }>(`/products?limit=50&search=${search}`).then(r => {
      const res = r.data as any
      return res.data || res
    }),
  })

  const products = (Array.isArray(data) ? data : []) as Product[]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Catálogo de Produtos</h1>
          <p className="text-sm text-text-muted mt-0.5">{products.length} produtos</p>
        </div>
        <Button icon={<Plus size={16} />}>Novo produto</Button>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto..." className="input-base pl-9" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard count={6} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => {
            const profitColor = p.marginPercent >= 100 ? 'text-success bg-green-400/10 border-green-400/20'
              : p.marginPercent >= 50 ? 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
              : 'text-warning bg-amber-400/10 border-amber-400/20'

            return (
              <div key={p.id} className="card hover:border-border-accent transition-colors duration-200 cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">{p.emoji || '📦'}</div>
                  <span className={`badge border ${profitColor}`}>+{formatPercent(p.marginPercent, 0)}</span>
                </div>
                <h3 className="font-semibold text-text-primary mb-1">{p.name}</h3>
                {p.description && <p className="text-xs text-text-muted mb-3 line-clamp-2">{p.description}</p>}

                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <p className="text-text-muted">Peso</p>
                    <p className="font-medium text-text-secondary">{p.weightG}g</p>
                  </div>
                  <div>
                    <p className="text-text-muted">Impressão</p>
                    <p className="font-medium text-text-secondary">{formatDuration(p.printTimeMin)}</p>
                  </div>
                  <div>
                    <p className="text-text-muted">Custo base</p>
                    <p className="font-mono font-medium text-text-secondary">{formatCurrency(p.baseCost)}</p>
                  </div>
                  <div>
                    <p className="text-text-muted">Lucro</p>
                    <p className="font-mono font-medium text-success">{formatCurrency(p.suggestedPrice - p.baseCost)}</p>
                  </div>
                </div>

                {p.filament && (
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <div className="w-2.5 h-2.5 rounded-full border border-border/50" style={{ backgroundColor: p.filament.colorHex }} />
                    {p.filament.name}
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-text-muted">Preço sugerido</span>
                  <span className="text-lg font-bold font-mono text-text-primary">{formatCurrency(p.suggestedPrice)}</span>
                </div>
              </div>
            )
          })}
          {products.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
              <Package size={40} className="text-text-muted mb-3" />
              <p className="text-text-secondary">Nenhum produto cadastrado ainda</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
