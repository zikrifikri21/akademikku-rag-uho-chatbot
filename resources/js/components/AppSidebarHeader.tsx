import type { BreadcrumbItem as BreadcrumbItemType } from '@/types'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { SidebarTrigger } from '@/components/ui/sidebar'

interface AppSidebarHeaderProps {
  breadcrumbs?: BreadcrumbItemType[]
}

export function AppSidebarHeader({ breadcrumbs = [] }: AppSidebarHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        {breadcrumbs.length > 0 && (
          <Breadcrumbs breadcrumbs={breadcrumbs} />
        )}
      </div>
    </header>
  )
}
