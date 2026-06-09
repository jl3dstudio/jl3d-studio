// Tipos globais do JL3D Studio

export type UserRole = 'ADMIN' | 'OPERATOR'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatarUrl?: string
  company?: Company
  createdAt: string
}

export interface Company {
  id: string
  name: string
  logoUrl?: string
  slogan?: string
  cnpj?: string
  address?: string
  phone?: string
  whatsapp?: string
  email?: string
  website?: string
}

export interface Printer {
  id: string
  name: string
  model?: string
  powerWatts: number
  purchaseValue: number
  usefulLifeHours: number
  totalHoursUsed: number
  isActive: boolean
  notes?: string
  createdAt: string
}

export type FilamentType = 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'ASA' | 'NYLON' | 'RESIN' | 'OTHER'

export interface Filament {
  id: string
  name: string
  type: FilamentType
  brand?: string
  colorName: string
  colorHex: string
  spoolWeightG: number
  pricePaid: number
  purchaseDate?: string
  currentWeightG: number
  minStockG: number
  tags: string[]
  notes?: string
  isActive: boolean
  createdAt: string
  costPerGram?: number
  isLowStock?: boolean
}

export interface Product {
  id: string
  name: string
  description?: string
  emoji?: string
  filamentId?: string
  filament?: Pick<Filament, 'name' | 'colorHex' | 'colorName'>
  weightG: number
  printTimeMin: number
  laborTimeMin: number
  postProcessCost: number
  baseCost: number
  suggestedPrice: number
  marginPercent: number
  tags: string[]
  isActive: boolean
  createdAt: string
}

export type ClientType = 'PERSON' | 'RETAILER' | 'COMPANY'

export interface Client {
  id: string
  name: string
  type: ClientType
  whatsapp?: string
  email?: string
  address?: string
  document?: string
  tags: string[]
  notes?: string
  isActive: boolean
  createdAt: string
  _count?: { orders: number; quotes: number }
  lifetimeValue?: number
}

export type QuoteStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
export type DiscountType = 'PERCENT' | 'FIXED'

export interface QuoteItem {
  id: string
  productId?: string
  product?: Pick<Product, 'name' | 'emoji'>
  name: string
  description?: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface Quote {
  id: string
  number: string
  clientId: string
  client?: Pick<Client, 'name' | 'type'>
  userId: string
  status: QuoteStatus
  discountType?: DiscountType
  discountValue: number
  paymentMethod?: string
  validUntil?: string
  notes?: string
  publicToken?: string
  subtotal: number
  total: number
  items: QuoteItem[]
  createdAt: string
  updatedAt: string
}

export type OrderStatus = 'PENDING' | 'PRINTING' | 'POST_PROCESS' | 'READY' | 'DELIVERED' | 'CANCELLED'

export interface OrderItem {
  id: string
  productId?: string
  product?: Pick<Product, 'name' | 'emoji'>
  printerId?: string
  printer?: Pick<Printer, 'name'>
  filamentId?: string
  filament?: Pick<Filament, 'name' | 'colorHex' | 'colorName'>
  name: string
  quantity: number
  weightG?: number
  printTimeMin?: number
  unitPrice: number
  totalPrice: number
  filamentUsedG?: number
}

export interface OrderStatusHistory {
  id: string
  fromStatus?: OrderStatus
  toStatus: OrderStatus
  notes?: string
  createdAt: string
  user: Pick<User, 'name'>
}

export interface Order {
  id: string
  number: string
  clientId: string
  client?: Pick<Client, 'name' | 'type'>
  userId: string
  user?: Pick<User, 'name'>
  quoteId?: string
  status: OrderStatus
  estimatedDelivery?: string
  deliveredAt?: string
  productionNotes?: string
  subtotal: number
  total: number
  printTimeMinReal?: number
  items: OrderItem[]
  history?: OrderStatusHistory[]
  createdAt: string
  updatedAt: string
}

export type PaymentStatus = 'PENDING' | 'RECEIVED' | 'OVERDUE'

export interface Revenue {
  id: string
  orderId?: string
  order?: { number: string }
  description: string
  amount: number
  paymentMethod?: string
  status: PaymentStatus
  dueDate?: string
  paidAt?: string
  installments: number
  notes?: string
  createdAt: string
}

export type ExpenseCategory = 'FILAMENT' | 'ENERGY' | 'EQUIPMENT' | 'MAINTENANCE' | 'MARKETING' | 'OTHER'

export interface Expense {
  id: string
  category: ExpenseCategory
  description: string
  amount: number
  date: string
  receiptUrl?: string
  notes?: string
  createdAt: string
}

export interface DashboardData {
  kpis: {
    monthRevenue: number
    activeOrders: number
    profitEstimate: number
    profitPercent: number
    activeClients: number
    lowStockCount: number
  }
  charts: {
    revenueByMonth: { month: string; value: number }[]
    ordersByStatus: { status: OrderStatus; count: number }[]
    topProducts: { name: string; quantity: number; revenue: number }[]
    materialDistribution: { name: string; count: number; color: string }[]
  }
  alerts: {
    lowStockFilaments: Pick<Filament, 'id' | 'name' | 'colorHex' | 'colorName' | 'currentWeightG' | 'minStockG'>[]
  }
  recentOrders: (Pick<Order, 'id' | 'number' | 'status' | 'total' | 'createdAt'> & { client: Pick<Client, 'name'> })[]
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export interface Settings {
  kwh_price: string
  operator_hourly_rate: string
  failure_rate_percent: string
  default_margin_percent: string
  currency: string
  timezone: string
  quote_validity_days: string
}
