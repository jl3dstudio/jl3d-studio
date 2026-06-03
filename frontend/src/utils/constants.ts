import type { OrderStatus, QuoteStatus, FilamentType, ClientType, ExpenseCategory, PaymentStatus } from '@/types'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Aguardando',
  PRINTING: 'Em impressão',
  POST_PROCESS: 'Pós-processo',
  READY: 'Pronto',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-400/10 text-warning border-amber-400/20',
  PRINTING: 'bg-blue-500/10 text-brand-300 border-brand-500/20',
  POST_PROCESS: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
  READY: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20',
  DELIVERED: 'bg-green-400/10 text-success border-green-400/20',
  CANCELLED: 'bg-red-400/10 text-danger border-red-400/20',
}

export const ORDER_STATUS_EMOJI: Record<OrderStatus, string> = {
  PENDING: '📋',
  PRINTING: '⚙️',
  POST_PROCESS: '🔧',
  READY: '✅',
  DELIVERED: '🚚',
  CANCELLED: '❌',
}

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: 'Rascunho',
  SENT: 'Enviado',
  APPROVED: 'Aprovado',
  REJECTED: 'Recusado',
  EXPIRED: 'Expirado',
}

export const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  DRAFT: 'bg-bg-500 text-text-secondary border-border',
  SENT: 'bg-blue-500/10 text-brand-300 border-brand-500/20',
  APPROVED: 'bg-green-400/10 text-success border-green-400/20',
  REJECTED: 'bg-red-400/10 text-danger border-red-400/20',
  EXPIRED: 'bg-amber-400/10 text-warning border-amber-400/20',
}

export const FILAMENT_TYPE_LABELS: Record<FilamentType, string> = {
  PLA: 'PLA',
  PETG: 'PETG',
  ABS: 'ABS',
  TPU: 'TPU (Flexível)',
  ASA: 'ASA',
  NYLON: 'Nylon',
  RESIN: 'Resina',
  OTHER: 'Outro',
}

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  PERSON: 'Pessoa Física',
  RETAILER: 'Lojista',
  COMPANY: 'Empresa',
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  FILAMENT: 'Filamento',
  ENERGY: 'Energia',
  EQUIPMENT: 'Equipamento',
  MAINTENANCE: 'Manutenção',
  MARKETING: 'Marketing',
  OTHER: 'Outros',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Pendente',
  RECEIVED: 'Recebido',
  OVERDUE: 'Atrasado',
}

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  PENDING: 'bg-amber-400/10 text-warning border-amber-400/20',
  RECEIVED: 'bg-green-400/10 text-success border-green-400/20',
  OVERDUE: 'bg-red-400/10 text-danger border-red-400/20',
}

export const PAYMENT_METHODS = ['PIX', 'Crédito', 'Débito', 'Dinheiro', 'Boleto', 'Transferência']
