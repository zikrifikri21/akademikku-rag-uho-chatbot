import type { ChatHistory } from '@/types'
import { Link } from '@inertiajs/react'
import * as React from 'react'
import { AppLogo } from '@/components/AppLogo'
import { NavMain } from '@/components/NavMain'
import { NavUser } from '@/components/NavUser'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

interface AppSidebarProps {
  chatHistory?: ChatHistory
  children?: React.ReactNode
}

export function AppSidebar({ chatHistory, children }: AppSidebarProps) {
  return (
    <>
      <Sidebar collapsible="offcanvas" variant="sidebar">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                className="cursor-default hover:bg-transparent focus:bg-transparent pointer-events-none"
              >
                <Link href={route('chats.index')}>
                  <AppLogo />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <NavMain chatHistory={chatHistory} />
        </SidebarContent>

        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </Sidebar>
      {children}
    </>
  )
}
