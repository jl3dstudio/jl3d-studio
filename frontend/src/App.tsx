import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import AppLayout from '@/components/layout/AppLayout'

// Páginas
import LoginPage from '@/pages/auth/LoginPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import CalculatorPage from '@/pages/calculator/CalculatorPage'
import ProductsPage from '@/pages/products/ProductsPage'
import FilamentsPage from '@/pages/filaments/FilamentsPage'
import ClientsPage from '@/pages/clients/ClientsPage'
import QuotesPage from '@/pages/quotes/QuotesPage'
import OrdersPage from '@/pages/orders/OrdersPage'
import FinancialPage from '@/pages/financial/FinancialPage'
import AnalyticsPage from '@/pages/analytics/AnalyticsPage'
import SettingsPage from '@/pages/settings/SettingsPage'
import QuotePublicPage from '@/pages/quotes/QuotePublicPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota pública de orçamento */}
        <Route path="/orcamento/:token" element={<QuotePublicPage />} />

        {/* Auth */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

        {/* App autenticado */}
        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="calculadora" element={<CalculatorPage />} />
          <Route path="produtos" element={<ProductsPage />} />
          <Route path="filamentos" element={<FilamentsPage />} />
          <Route path="clientes" element={<ClientsPage />} />
          <Route path="orcamentos" element={<QuotesPage />} />
          <Route path="pedidos" element={<OrdersPage />} />
          <Route path="financeiro" element={<FinancialPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="configuracoes" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
