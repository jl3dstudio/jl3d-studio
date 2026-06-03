import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Calculator, Package, Layers, Users,
  FileText, ShoppingBag, Wallet, BarChart3, Settings,
  ChevronLeft, ChevronRight, LogOut, Printer,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/stores/authStore'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/calculadora', icon: Calculator, label: 'Calculadora' },
  { to: '/produtos', icon: Package, label: 'Produtos' },
  { to: '/filamentos', icon: Layers, label: 'Filamentos' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/orcamentos', icon: FileText, label: 'Orçamentos' },
  { to: '/pedidos', icon: ShoppingBag, label: 'Pedidos' },
  { to: '/financeiro', icon: Wallet, label: 'Financeiro' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
]

const bottomItems = [
  { to: '/configuracoes', icon: Settings, label: 'Configurações' },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  isMobile: boolean
  onNavClick: () => void
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, isMobile, onNavClick }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-bg-900 border-r border-border transition-all duration-300',
        !isMobile && (collapsed ? 'w-16' : 'w-60'),
        isMobile && 'w-60',
        isMobile && (mobileOpen ? 'translate-x-0' : '-translate-x-full'),
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-border flex-shrink-0',
        !isMobile && collapsed ? 'justify-center' : 'gap-3',
      )}>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-500 flex-shrink-0">
          <Printer size={16} className="text-white" />
        </div>
        {(!collapsed || isMobile) && (
          <div className="animate-fade-in">
            <p className="text-sm font-bold text-text-primary leading-none">JL3D</p>
            <p className="text-[10px] text-text-muted">Studio</p>
          </div>
        )}
      </div>

      {/* Nav principal */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-0.5 px-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={onNavClick}
                title={(!isMobile && collapsed) ? label : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-all duration-150 group relative',
                    (!isMobile && collapsed) ? 'justify-center' : '',
                    isActive
                      ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-700',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} className={cn('flex-shrink-0', isActive && 'text-brand-400')} />
                    {(isMobile || !collapsed) && (
                      <span className="animate-fade-in font-medium">{label}</span>
                    )}
                    {/* Tooltip quando collapsed desktop */}
                    {!isMobile && collapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-bg-600 border border-border rounded-md text-xs text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                        {label}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom items */}
      <div className="border-t border-border py-3 px-2 space-y-0.5">
        {bottomItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavClick}
            title={(!isMobile && collapsed) ? label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-all duration-150',
                (!isMobile && collapsed) ? 'justify-center' : '',
                isActive
                  ? 'bg-brand-500/10 text-brand-400'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-700',
              )
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {(isMobile || !collapsed) && <span className="font-medium">{label}</span>}
          </NavLink>
        ))}

        {/* Usuário */}
        <div className={cn(
          'flex items-center gap-2 px-2.5 py-2 mt-1',
          (!isMobile && collapsed) ? 'justify-center' : '',
        )}>
          <div className="w-7 h-7 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-brand-400">
              {user?.name.charAt(0).toUpperCase()}
            </span>
          </div>
          {(isMobile || !collapsed) && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-xs font-medium text-text-primary truncate">{user?.name}</p>
              <p className="text-[10px] text-text-muted">{user?.role === 'ADMIN' ? 'Administrador' : 'Operador'}</p>
            </div>
          )}
          {(isMobile || !collapsed) && (
            <button
              onClick={handleLogout}
              title="Sair"
              className="p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Toggle button — apenas desktop */}
      {!isMobile && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-bg-600 border border-border flex items-center justify-center text-text-muted hover:text-text-primary transition-colors z-50"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      )}
    </aside>
  )
}
