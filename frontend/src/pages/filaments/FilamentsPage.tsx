import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, AlertTriangle, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/services/api'
import type { Filament } from '@/types'
import { formatCurrency, formatWeight } from '@/utils/format'
import { FILAMENT_TYPE_LABELS } from '@/utils/constants'
import Button from '@/components/ui/Button'
import { SkeletonCard } from '@/components/ui/Skeleton'

export default function FilamentsPage() {
  const [search, setSearch] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['filaments', search],
    queryFn: () => api.get<{ data: Filament[] }>(`/filaments?limit=50&search=${search}`).then(r => r.data.data),
  })

  const filaments = (Array.isArray(data) ? data : []) as Filament[]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Filamentos</h1>
          <p className="text-sm text-text-muted mt-0.5">{filaments.length} filamentos cadastrados</p>
        </div>
        <Button icon={<Plus size={16} />}>Novo filamento</Button>
      </div>

      {/* Busca */}
      <div className="relative mb-6 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar filamento..."
          className="input-base pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <SkeletonCard count={8} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filaments.map(fil => {
            const isLow = fil.currentWeightG <= fil.minStockG
            const costPerG = fil.pricePaid / fil.spoolWeightG
            const usedPercent = ((fil.spoolWeightG - fil.currentWeightG) / fil.spoolWeightG) * 100

            return (
              <div key={fil.id} className={`card hover:border-border-accent transition-colors duration-200 ${isLow ? 'border-amber-400/30' : ''}`}>
                {/* Cor + badge */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl border-2 border-border flex-shrink-0" style={{ backgroundColor: fil.colorHex }} />
                    <div>
                      <p className="text-sm font-semibold text-text-primary leading-tight">{fil.name}</p>
                      <p className="text-xs text-text-muted">{fil.brand}</p>
                    </div>
                  </div>
                  <span className="badge bg-bg-600 text-text-secondary border border-border text-[10px]">
                    {FILAMENT_TYPE_LABELS[fil.type]}
                  </span>
                </div>

                {/* Barra de estoque */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-text-muted mb-1">
                    <span>{formatWeight(fil.currentWeightG)} restante</span>
                    <span>{usedPercent.toFixed(0)}% usado</span>
                  </div>
                  <div className="h-1.5 bg-bg-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isLow ? 'bg-warning' : 'bg-brand-500'}`}
                      style={{ width: `${Math.max(100 - usedPercent, 0)}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-bg-800">
                    <p className="text-text-muted">Custo/g</p>
                    <p className="font-mono font-medium text-text-primary">{formatCurrency(costPerG)}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-bg-800">
                    <p className="text-text-muted">Custo/kg</p>
                    <p className="font-mono font-medium text-text-primary">{formatCurrency(costPerG * 1000)}</p>
                  </div>
                </div>

                {isLow && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-warning">
                    <AlertTriangle size={12} />
                    Estoque abaixo do mínimo ({formatWeight(fil.minStockG)})
                  </div>
                )}
              </div>
            )
          })}
          {filaments.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
              <Package size={40} className="text-text-muted mb-3" />
              <p className="text-text-secondary">Nenhum filamento encontrado</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
