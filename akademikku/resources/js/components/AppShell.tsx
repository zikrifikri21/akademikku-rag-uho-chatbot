import * as React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'

interface AppShellProps {
  children: React.ReactNode
  variant?: 'sidebar' | 'header'
}

export function AppShell({ children, variant = 'sidebar' }: AppShellProps) {
  if (variant === 'header') {
    return <div className="flex min-h-screen flex-col">{children}</div>
  }

  return <SidebarProvider>{children}</SidebarProvider>
}
