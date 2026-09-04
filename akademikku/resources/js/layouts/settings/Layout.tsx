import type { NavItem } from '@/types'
import { Link, usePage } from '@inertiajs/react'
import { Lock, Palette, User as UserIcon } from 'lucide-react'
import { Heading } from '@/components/Heading'
import { Separator } from '@/components/ui/separator'
import AppLayout from '@/layouts/AppLayout'

interface SettingsLayoutProps {
  children: React.ReactNode
}

const sidebarNavItems: NavItem[] = [
  {
    title: 'Profile',
    href: '/settings/profile',
    icon: UserIcon,
  },
  {
    title: 'Password',
    href: '/settings/password',
    icon: Lock,
  },
  {
    title: 'Appearance',
    href: '/settings/appearance',
    icon: Palette,
  },
]

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const page = usePage()

  return (
    <AppLayout breadcrumbs={[{ title: 'Settings', href: '/settings/profile' }]}>
      <div className="px-4 py-6 md:px-8 max-w-6xl mx-auto space-y-6">
        <Heading
          title="Settings"
          description="Manage your account settings and preferences"
        />

        <Separator />

        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="w-full lg:w-1/5">
            <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
              {sidebarNavItems.map(item => {
                const IconComp = item.icon
                const isActive = page.url === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-muted text-foreground font-semibold'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                  >
                    {IconComp && <IconComp className="h-4 w-4" />}
                    <span>{item.title}</span>
                  </Link>
                )
              })}
            </nav>
          </aside>

          <div className="flex-1 lg:max-w-2xl">{children}</div>
        </div>
      </div>
    </AppLayout>
  )
}

export default SettingsLayout
