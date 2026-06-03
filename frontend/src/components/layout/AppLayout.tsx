import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { cn } from '@/utils/cn'

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setCollapsed(true)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleNavClick = () => {
    if (isMobile) setMobileOpen(false)
  }

  return (
    <div className="min-h-screen bg-bg-800">
      {/* Overlay mobile */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        collapsed={isMobile ? false : collapsed}
        onToggle={() => isMobile ? setMobileOpen(o => !o) : setCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        isMobile={isMobile}
        onNavClick={handleNavClick}
      />

      <Topbar
        sidebarCollapsed={isMobile ? true : collapsed}
        isMobile={isMobile}
        onMenuClick={() => setMobileOpen(o => !o)}
      />

      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300',
          isMobile ? 'pl-0' : collapsed ? 'pl-16' : 'pl-60',
        )}
      >
        <div className="p-4 md:p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
