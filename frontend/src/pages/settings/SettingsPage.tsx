import React, { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Save, Printer, Building, Sliders } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/services/api'
import type { Settings, Company } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function SettingsPage() {
  const [tab, setTab] = React.useState<'production' | 'company' | 'printers'>('production')
  const qc = useQueryClient()

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<{ data: Settings }>('/settings').then(r => r.data.data),
  })

  const { data: company } = useQuery({
    queryKey: ['company'],
    queryFn: () => api.get<{ data: Company }>('/company').then(r => r.data.data),
  })

  const settingsForm = useForm<Settings>()
  const companyForm = useForm<Company>()

  useEffect(() => { if (settings) settingsForm.reset(settings) }, [settings])
  useEffect(() => { if (company) companyForm.reset(company) }, [company])

  const saveSettings = useMutation({
    mutationFn: (data: Settings) => api.put('/settings', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); toast.success('Configurações salvas') },
  })

  const saveCompany = useMutation({
    mutationFn: (data: Partial<Company>) => api.put('/company', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company'] }); toast.success('Dados da empresa salvos') },
  })

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="mb-7">
        <h1 className="page-title">Configurações</h1>
        <p className="text-sm text-text-muted mt-0.5">Ajuste os parâmetros do sistema</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-bg-700 border border-border rounded-lg w-fit mb-6">
        {[
          { key: 'production', label: 'Produção', icon: Sliders },
          { key: 'company', label: 'Empresa', icon: Building },
          { key: 'printers', label: 'Impressoras', icon: Printer },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === key ? 'bg-brand-500 text-white' : 'text-text-muted hover:text-text-primary'}`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Produção */}
      {tab === 'production' && (
        <form onSubmit={settingsForm.handleSubmit(d => saveSettings.mutate(d))} className="card space-y-5">
          <h3 className="text-sm font-semibold text-text-primary">Parâmetros de produção</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Preço do kWh (R$)" type="number" step="0.01" {...settingsForm.register('kwh_price')} />
            <Input label="Valor/hora do operador (R$)" type="number" step="0.01" {...settingsForm.register('operator_hourly_rate')} />
            <Input label="Taxa de falha estimada (%)" type="number" step="0.1" {...settingsForm.register('failure_rate_percent')} />
            <Input label="Margem padrão (%)" type="number" step="1" {...settingsForm.register('default_margin_percent')} />
            <Input label="Validade padrão de orçamentos (dias)" type="number" step="1" {...settingsForm.register('quote_validity_days')} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={saveSettings.isPending} icon={<Save size={14} />}>
              Salvar configurações
            </Button>
          </div>
        </form>
      )}

      {/* Empresa */}
      {tab === 'company' && (
        <form onSubmit={companyForm.handleSubmit(d => saveCompany.mutate(d))} className="card space-y-5">
          <h3 className="text-sm font-semibold text-text-primary">Dados da empresa</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nome da empresa" {...companyForm.register('name')} required />
            <Input label="Slogan" {...companyForm.register('slogan')} />
            <Input label="CNPJ" {...companyForm.register('cnpj')} />
            <Input label="Telefone" {...companyForm.register('phone')} />
            <Input label="WhatsApp" {...companyForm.register('whatsapp')} />
            <Input label="Email" type="email" {...companyForm.register('email')} />
            <Input label="Website" {...companyForm.register('website')} />
            <Input label="Endereço" {...companyForm.register('address')} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={saveCompany.isPending} icon={<Save size={14} />}>
              Salvar dados da empresa
            </Button>
          </div>
        </form>
      )}

      {/* Impressoras */}
      {tab === 'printers' && (
        <div className="space-y-4">
          <PrintersSettings />
        </div>
      )}
    </div>
  )
}

function PrintersSettings() {
  const { data: printers, isLoading } = useQuery({
    queryKey: ['printers'],
    queryFn: () => api.get<{ data: any[] }>('/printers').then(r => r.data.data || []),
  })

  if (isLoading) return <div className="card"><div className="skeleton h-20 rounded" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">Impressoras cadastradas</h3>
        <Button size="sm" icon={<Printer size={13} />}>Adicionar</Button>
      </div>
      <div className="space-y-3">
        {(printers || []).map((p: any) => (
          <div key={p.id} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-primary">{p.name}</p>
                {p.model && <p className="text-xs text-text-muted">{p.model}</p>}
              </div>
              <div className="text-right text-xs text-text-muted">
                <p>{p.powerWatts}W · R${(p.purchaseValue / p.usefulLifeHours).toFixed(2)}/h depreciação</p>
                <p>{p.totalHoursUsed}h de {p.usefulLifeHours}h usadas</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
