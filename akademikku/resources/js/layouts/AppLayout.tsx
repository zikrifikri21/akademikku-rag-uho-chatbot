import type { BreadcrumbItem, ChatHistory } from '@/types'
import { AppShell } from '@/components/AppShell'
import { AppSidebar } from '@/components/AppSidebar'
import { AppSidebarHeader } from '@/components/AppSidebarHeader'

interface AppLayoutProps {
  breadcrumbs?: BreadcrumbItem[]
  chatHistory?: ChatHistory
  children: React.ReactNode
}

export function AppLayout({ breadcrumbs, chatHistory, children }: AppLayoutProps) {
  return (
    <AppShell variant="sidebar">
      <AppSidebar chatHistory={chatHistory} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppSidebarHeader breadcrumbs={breadcrumbs} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </AppShell>
  )
}

export default AppLayout
