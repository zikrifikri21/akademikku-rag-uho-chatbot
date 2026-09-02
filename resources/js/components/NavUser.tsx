import { ChevronsUpDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { UserInfo } from '@/components/UserInfo'
import { useAuth } from '@/hooks/useAuth'
import { UserMenuContent } from './UserMenuContent'

const guestUser = {
  id: 0,
  name: 'Guest User',
  email: '',
  avatar: '',
  email_verified_at: null,
  created_at: '',
  updated_at: '',
}

export function NavUser() {
  const { user } = useAuth()
  const { isMobile, state } = useSidebar()

  const currentUser = user ?? guestUser

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserInfo user={currentUser} />
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : state === 'collapsed' ? 'left' : 'bottom'}
            align="end"
            sideOffset={4}
          >
            <UserMenuContent user={currentUser} />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
