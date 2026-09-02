import type { BreadcrumbItem, ChatHistory } from '@/types'
import { Head } from '@inertiajs/react'
import { PlaceholderPattern } from '@/components/PlaceholderPattern'
import AppLayout from '@/layouts/AppLayout'

interface DashboardProps {
  chatHistory?: ChatHistory
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
]

export default function Dashboard({ chatHistory }: DashboardProps) {
  return (
    <>
      <Head title="Dashboard" />
      <AppLayout breadcrumbs={breadcrumbs} chatHistory={chatHistory}>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
              <PlaceholderPattern />
            </div>
            <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
              <PlaceholderPattern />
            </div>
            <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
              <PlaceholderPattern />
            </div>
          </div>
          <div className="relative min-h-[100px] flex-1 rounded-xl border border-sidebar-border/70 dark:border-sidebar-border md:min-h-min">
            <PlaceholderPattern />
          </div>
        </div>
      </AppLayout>
    </>
  )
}
