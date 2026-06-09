import React, { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Save, Printer, Building, Sliders, Users, Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/services/api'
import type { Settings, Company } from '@/types'
import { useAuthStore } from '@/stores/authStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface UserData {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'OPERATOR'
  isActive: boolean
  createdAt: string
}

interface NewUserForm {
  name: string
  email: string
  password: string
  role: 'ADMIN' | 'OPERATOR'
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'
  const [tab, setTab] = useState<'production' | 'company' | 'printers' | 'users'>('production')
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

  const tabs = [
    { key: 'production', label: 'Produção', icon: Sliders },
    { key: 'company', label: 'Empresa', icon: Building },
    { key: 'printers', label: 'Impressoras', icon: Printer },
    ...(isAdmin ? [{ key: 'users', label: 'Usuários', icon: Users }] : []),
  ]

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="mb-7">
        <h1 className="page-title">Configurações</h1>
        <p className="text-sm text-text-muted mt-0.5">Ajuste os parâmetros do sistema</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 p-1 bg-bg-700 border border-border rounded-lg w-fit mb-6">
        {tabs.map(({ key, label, icon: Icon }) => (
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
            <Button type="submit" loading={saveSettings.isPending} icon={<Save size={14} />}>Salvar configurações</Button>
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
            <Button type="submit" loading={saveCompany.isPending} icon={<Save size={14} />}>Salvar dados da empresa</Button>
          </div>
        </form>
      )}

      {/* Impressoras */}
      {tab === 'printers' && <PrintersSettings />}

      {/* Usuários — somente admin */}
      {tab === 'users' && isAdmin && <UsersSettings />}
    </div>
  )
}

// ─── Impressoras ──────────────────────────────────────────────────────────────
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
        {(!printers || printers.length === 0) && (
          <p className="text-sm text-text-muted text-center py-8">Nenhuma impressora cadastrada</p>
        )}
      </div>
    </div>
  )
}

// ─── Usuários (Admin only) ────────────────────────────────────────────────────
function UsersSettings() {
  const qc = useQueryClient()
  const { user: currentUser } = useAuthStore()
  const [showForm, setShowForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { data: users, isLoading } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => api.get<{ data: UserData[] }>('/users').then(r => r.data.data || []),
  })

  const form = useForm<NewUserForm>({ defaultValues: { role: 'OPERATOR' } })

  const createUser = useMutation({
    mutationFn: (data: NewUserForm) => api.post('/users', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users-list'] })
      toast.success('Usuário criado com sucesso!')
      form.reset({ role: 'OPERATOR' })
      setShowForm(false)
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao criar usuário'),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/users/${id}`, { isActive: !isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users-list'] })
      toast.success('Status atualizado')
    },
  })

  const deleteUser = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users-list'] })
      toast.success('Usuário removido')
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao remover usuário'),
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Usuários do sistema</h3>
        <Button size="sm" icon={<Plus size={13} />} onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancelar' : 'Novo usuário'}
        </Button>
      </div>

      {/* Formulário de criação */}
      {showForm && (
        <form
          onSubmit={form.handleSubmit(d => createUser.mutate(d))}
          className="card space-y-4 border border-brand-500/30"
        >
          <h4 className="text-sm font-semibold text-text-primary">Cadastrar novo usuário</h4>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nome completo" {...form.register('name', { required: true })} required />
            <Input label="Email" type="email" {...form.register('email', { required: true })} required />
            <div className="relative">
              <Input
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                {...form.register('password', { required: true, minLength: 6 })}
                required
                rightIcon={
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="text-text-muted hover:text-text-primary">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">Perfil</label>
              <select
                {...form.register('role')}
                className="input-base"
              >
                <option value="OPERATOR">Operador</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button type="submit" loading={createUser.isPending} icon={<Plus size={14} />}>Criar usuário</Button>
          </div>
        </form>
      )}

      {/* Lista de usuários */}
      {isLoading ? (
        <div className="card"><div className="skeleton h-16 rounded" /></div>
      ) : (
        <div className="space-y-2">
          {(users || []).map((u) => (
            <div key={u.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-sm">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{u.name}</p>
                  <p className="text-xs text-text-muted">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge text-xs ${u.role === 'ADMIN' ? 'badge-blue' : 'badge-gray'}`}>
                  {u.role === 'ADMIN' ? 'Admin' : 'Operador'}
                </span>
                <span className={`badge text-xs ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                  {u.isActive ? 'Ativo' : 'Inativo'}
                </span>
                {u.id !== currentUser?.id && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleActive.mutate({ id: u.id, isActive: u.isActive })}
                      className="text-xs text-text-muted hover:text-text-primary px-2 py-1 rounded border border-border hover:border-border-accent transition-colors"
                    >
                      {u.isActive ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => { if (confirm(`Remover ${u.name}?`)) deleteUser.mutate(u.id) }}
                      className="text-danger hover:text-danger/80 p-1 rounded hover:bg-danger/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {(!users || users.length === 0) && (
            <p className="text-sm text-text-muted text-center py-8">Nenhum usuário cadastrado</p>
          )}
        </div>
      )}
    </div>
  )
}
