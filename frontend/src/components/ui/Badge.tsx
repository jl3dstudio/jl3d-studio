import React from 'react'
import { cn } from '@/utils/cn'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'cyan'
}

const variants = {
  default: 'bg-bg-500 text-text-secondary border border-border',
  success: 'bg-green-400/10 text-success border border-green-400/20',
  warning: 'bg-amber-400/10 text-warning border border-amber-400/20',
  danger: 'bg-red-400/10 text-danger border border-red-400/20',
  info: 'bg-blue-500/10 text-brand-300 border border-brand-500/20',
  cyan: 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20',
}

export default function Badge({ children, className, variant = 'default' }: BadgeProps) {
  return (
    <span className={cn('badge', variants[variant], className)}>
      {children}
    </span>
  )
}
