import type { BreadcrumbItem, NavItem } from '@/types'
import { Link, usePage } from '@inertiajs/react'
import { LayoutGrid, Menu, Search } from 'lucide-react'
import { AppLogo } from '@/components/AppLogo'
import { AppLogoIcon } from '@/components/AppLogoIcon'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface AppHeaderProps {
  breadcrumbs?: BreadcrumbItem[]
}

const mainNavItems: NavItem[] = [
  {
    title: 'Chat',
    href: '/chat',
    icon: LayoutGrid,
  },
]

export function AppHeader({ breadcrumbs = [] }: AppHeaderProps) {
  const page = usePage()

  const isCurrentRoute = (url: string) => page.url === url

  const activeItemStyles = (url: string) =>
    isCurrentRoute(url)
      ? 'text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
      : ''

  return (
    <div>
      <div className="border-b border-sidebar-border/80">
        <div className="mx-auto flex h-16 items-center px-4 md:max-w-7xl">
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-2 h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-6">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetHeader className="flex justify-start text-left">
                  <AppLogoIcon className="size-6 fill-current text-black dark:text-white" />
                </SheetHeader>
                <div className="flex h-full flex-1 flex-col justify-between space-y-4 py-6">
                  <nav className="-mx-3 space-y-1">
                    {mainNavItems.map(item => {
                      const IconComp = item.icon
                      return (
                        <Link
                          key={item.title}
                          href={item.href}
                          className={`flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent ${activeItemStyles(item.href)}`}
                        >
                          {IconComp && <IconComp className="h-5 w-5" />}
                          {item.title}
                        </Link>
                      )
                    })}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <Link href={route('chats.index')} className="flex items-center gap-x-2">
            <AppLogo />
          </Link>

          <div className="hidden h-full lg:flex lg:flex-1">
            <NavigationMenu className="ml-10 flex h-full items-stretch">
              <NavigationMenuList className="flex h-full items-stretch space-x-2">
                {mainNavItems.map((item, index) => {
                  const IconComp = item.icon
                  return (
                    <NavigationMenuItem key={index} className="relative flex h-full items-center">
                      <Link href={item.href}>
                        <NavigationMenuLink
                          className={`h-9 cursor-pointer px-3 ${navigationMenuTriggerStyle()} ${activeItemStyles(item.href)}`}
                        >
                          {IconComp && <IconComp className="mr-2 h-4 w-4" />}
                          {item.title}
                        </NavigationMenuLink>
                      </Link>
                      {isCurrentRoute(item.href) && (
                        <div className="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-black dark:bg-white" />
                      )}
                    </NavigationMenuItem>
                  )
                })}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="ml-auto flex items-center space-x-2">
            <div className="relative flex items-center space-x-1">
              <Button variant="ghost" size="icon" className="group h-9 w-9 cursor-pointer">
                <Search className="size-5 opacity-80 group-hover:opacity-100" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {breadcrumbs.length > 1 && (
        <div className="flex w-full border-b border-sidebar-border/70">
          <div className="mx-auto flex h-12 w-full items-center justify-start px-4 text-neutral-500 md:max-w-7xl">
            <Breadcrumbs breadcrumbs={breadcrumbs} />
          </div>
        </div>
      )}
    </div>
  )
}
