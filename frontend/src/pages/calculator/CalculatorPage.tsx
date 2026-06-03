import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calculator, TrendingUp, Zap, Clock, Weight } from 'lucide-react'
import api from '@/services/api'
import type { Filament, Settings } from '@/types'
import { formatCurrency, formatPercent } from '@/utils/format'
import { FILAMENT_TYPE_LABELS } from '@/utils/constants'

interface CalcInputs {
  filamentId: string
  weightG: number
  printTimeH: number
  printTimeMin: number
  quantity: number
  laborTimeMin: number
  postProcessCost: number
  marginPercent: number
}

interface CalcResult {
  filamentCost: number
  energyCost: number
  depreciationCost: number
  laborCost: number
  subTotal: number
  failureCost: number
  totalCost: number
  profit: number
  unitPrice: number
  totalPrice: number
  marginPercent: number
}

export default function CalculatorPage() {
  const [inputs, setInputs] = useState<CalcInputs>({
    filamentId: '',
    weightG: 50,
    printTimeH: 2,
    printTimeMin: 0,
    quantity: 1,
    laborTimeMin: 15,
    postProcessCost: 0,
    marginPercent: 80,
  })

  const [result, setResult] = useState<CalcResult | null>(null)

  const { data: filaments } = useQuery({
    queryKey: ['filaments-all'],
    queryFn: () => api.get<{ data: Filament[] }>('/filaments?limit=100').then(r => r.data.data),
  })

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<{ data: Settings }>('/settings').then(r => r.data.data),
  })

  const selectedFilament = filaments?.find(f => f.id === inputs.filamentId)

  // Cálculo em tempo real
  useEffect(() => {
    if (!selectedFilament || !settings) return

    const kwhPrice = parseFloat(settings.kwh_price || '0.75')
    const laborRate = parseFloat(settings.operator_hourly_rate || '15')
    const failureRate = parseFloat(settings.failure_rate_percent || '5') / 100
    const printerPowerW = 350 // padrão — idealmente virá da impressora selecionada

    const printTimeH = inputs.printTimeH + inputs.printTimeMin / 60

    // Custo do filamento
    const costPerG = selectedFilament.pricePaid / selectedFilament.spoolWeightG
    const filamentCost = costPerG * inputs.weightG

    // Custo de energia
    const energyCost = (printerPowerW / 1000) * printTimeH * kwhPrice

    // Depreciação (simplificada — sem impressora selecionada)
    const depreciationCost = printTimeH * 0.56 // estimativa genérica R$/h

    // Mão de obra
    const laborCost = laborRate * (inputs.laborTimeMin / 60)

    const subTotal = filamentCost + energyCost + depreciationCost + laborCost + inputs.postProcessCost
    const failureCost = subTotal * failureRate
    const totalCost = subTotal + failureCost

    const profit = totalCost * (inputs.marginPercent / 100)
    const unitPrice = totalCost + profit
    const totalPrice = unitPrice * inputs.quantity

    setResult({
      filamentCost,
      energyCost,
      depreciationCost,
      laborCost,
      subTotal,
      failureCost,
      totalCost,
      profit,
      unitPrice,
      totalPrice,
      marginPercent: inputs.marginPercent,
    })
  }, [inputs, selectedFilament, settings])

  const set = (key: keyof CalcInputs, value: number | string) =>
    setInputs(prev => ({ ...prev, [key]: value }))

  const profitBadgeColor = inputs.marginPercent >= 100
    ? 'bg-green-400/10 text-success border border-green-400/20'
    : inputs.marginPercent >= 50
    ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20'
    : 'bg-amber-400/10 text-warning border border-amber-400/20'

  return (
    <div className="animate-fade-in max-w-5xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Calculadora de Custos</h1>
          <p className="text-sm text-text-muted mt-0.5">Calcule o custo e preço sugerido em tempo real</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-5">
          {/* Filamento */}
          <div className="card">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Weight size={16} className="text-brand-400" /> Material
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">Filamento</label>
                <select
                  value={inputs.filamentId}
                  onChange={e => set('filamentId', e.target.value)}
                  className="input-base"
                >
                  <option value="">Selecione um filamento...</option>
                  {filaments?.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} — {FILAMENT_TYPE_LABELS[f.type]} — R${(f.pricePaid / f.spoolWeightG * 1000).toFixed(2)}/kg
                    </option>
                  ))}
                </select>
              </div>

              {selectedFilament && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-800 border border-border">
                  <div className="w-8 h-8 rounded-full border-2 border-border flex-shrink-0" style={{ backgroundColor: selectedFilament.colorHex }} />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{selectedFilament.colorName}</p>
                    <p className="text-xs text-text-muted">{formatCurrency(selectedFilament.pricePaid / selectedFilament.spoolWeightG)}/g · {selectedFilament.currentWeightG}g restantes</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">Peso da peça (g)</label>
                <input type="number" value={inputs.weightG} onChange={e => set('weightG', +e.target.value)} min="0" step="1" className="input-base font-mono" />
              </div>
            </div>
          </div>

          {/* Tempo */}
          <div className="card">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Clock size={16} className="text-cyan-400" /> Tempo
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">Impressão (h)</label>
                <input type="number" value={inputs.printTimeH} onChange={e => set('printTimeH', +e.target.value)} min="0" className="input-base font-mono" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">Impressão (min)</label>
                <input type="number" value={inputs.printTimeMin} onChange={e => set('printTimeMin', +e.target.value)} min="0" max="59" className="input-base font-mono" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">Mão de obra (min)</label>
                <input type="number" value={inputs.laborTimeMin} onChange={e => set('laborTimeMin', +e.target.value)} min="0" className="input-base font-mono" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">Quantidade</label>
                <input type="number" value={inputs.quantity} onChange={e => set('quantity', +e.target.value)} min="1" className="input-base font-mono" />
              </div>
            </div>
          </div>

          {/* Outros custos */}
          <div className="card">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Zap size={16} className="text-warning" /> Custos adicionais
            </h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">Pós-processo (R$)</label>
              <input type="number" value={inputs.postProcessCost} onChange={e => set('postProcessCost', +e.target.value)} min="0" step="0.01" className="input-base font-mono" />
            </div>
          </div>

          {/* Margem */}
          <div className="card">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-success" /> Margem de lucro
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Margem</span>
                <span className={`badge font-mono ${profitBadgeColor}`}>{inputs.marginPercent}%</span>
              </div>
              <input
                type="range"
                min="0" max="300" step="5"
                value={inputs.marginPercent}
                onChange={e => set('marginPercent', +e.target.value)}
                className="w-full accent-brand-500"
              />
              <div className="flex justify-between text-xs text-text-muted">
                <span>0%</span><span>100%</span><span>200%</span><span>300%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Resultado */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* Preço em destaque */}
              <div className="card border-brand-500/30 glow-blue">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="section-label">Preço sugerido por peça</p>
                    <p className="text-4xl font-bold font-mono text-text-primary mt-1">
                      {formatCurrency(result.unitPrice)}
                    </p>
                  </div>
                  <span className={`badge text-sm ${profitBadgeColor}`}>
                    +{formatPercent(result.marginPercent)} lucro
                  </span>
                </div>
                {inputs.quantity > 1 && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs text-text-muted">Total para {inputs.quantity} peças</p>
                    <p className="text-2xl font-bold font-mono text-brand-400">{formatCurrency(result.totalPrice)}</p>
                  </div>
                )}
              </div>

              {/* Breakdown de custos */}
              <div className="card">
                <p className="text-sm font-semibold text-text-primary mb-3">Composição do custo</p>
                <div className="space-y-2.5">
                  {[
                    { label: 'Filamento', value: result.filamentCost, color: 'bg-brand-500' },
                    { label: 'Energia', value: result.energyCost, color: 'bg-cyan-400' },
                    { label: 'Depreciação', value: result.depreciationCost, color: 'bg-purple-400' },
                    { label: 'Mão de obra', value: result.laborCost, color: 'bg-amber-400' },
                    { label: 'Pós-processo', value: inputs.postProcessCost, color: 'bg-orange-400' },
                    { label: 'Taxa de falha', value: result.failureCost, color: 'bg-red-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${color}`} />
                        <span className="text-text-secondary">{label}</span>
                      </div>
                      <span className="font-mono text-text-primary">{formatCurrency(value)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-sm font-semibold pt-2 border-t border-border">
                    <span className="text-text-secondary">Custo total</span>
                    <span className="font-mono text-text-primary">{formatCurrency(result.totalCost)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-semibold text-success">
                    <span>Lucro</span>
                    <span className="font-mono">{formatCurrency(result.profit)}</span>
                  </div>
                </div>
              </div>

              {/* Barra de composição */}
              <div className="card">
                <p className="text-xs text-text-muted mb-2">Distribuição do custo</p>
                <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                  {[
                    { value: result.filamentCost, color: '#2563EB' },
                    { value: result.energyCost, color: '#22D3EE' },
                    { value: result.depreciationCost, color: '#A78BFA' },
                    { value: result.laborCost, color: '#FBBF24' },
                    { value: result.failureCost, color: '#F87171' },
                  ].filter(i => i.value > 0).map(({ value, color }, idx) => (
                    <div
                      key={idx}
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${(value / result.totalCost) * 100}%`,
                        backgroundColor: color,
                      }}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="card flex flex-col items-center justify-center h-64 text-center">
              <Calculator size={40} className="text-text-muted mb-3" />
              <p className="text-text-secondary">Selecione um filamento</p>
              <p className="text-text-muted text-sm">e preencha os dados para ver o cálculo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
