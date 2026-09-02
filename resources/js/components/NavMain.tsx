import type { ChatHistory } from '@/types'
import { Link, usePage } from '@inertiajs/react'
import { useMemo } from 'react'
import { Icon } from '@/components/Icon'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/useAuth'
import { useChatHistory } from '@/hooks/useChatHistory'

interface NavMainProps {
  chatHistory?: ChatHistory
}

const defaultChatHistory: ChatHistory = {
  data: [],
  current_page: 1,
  next_page_url: null,
  path: '',
  per_page: 25,
  from: 0,
  to: 0,
  total: 0,
  first_page_url: '',
  last_page: 1,
  last_page_url: '',
  prev_page_url: null,
  links: [],
}

export function NavMain({ chatHistory = defaultChatHistory }: NavMainProps) {
  const page = usePage()
  const { groupedChatHistory, hasAnyHistory } = useChatHistory(chatHistory)
  const { isGuest } = useAuth()

  const mainMenuItems = [
    {
      label: 'New Chat',
      icon: 'lucide:message-circle-plus',
      href: route('chats.index'),
      external: false,
    },
    {
      label: 'GitHub Repo',
      icon: 'lucide:github',
      href: 'https://github.com/pushpak1300/ai-chat',
      target: '_blank',
      external: true,
    },
  ]

  const chatHistoryGroups = useMemo(
    () =>
      [
        { key: 'today', label: 'Today', items: groupedChatHistory.today },
        { key: 'yesterday', label: 'Yesterday', items: groupedChatHistory.yesterday },
        { key: 'lastSevenDays', label: 'Last 7 Days', items: groupedChatHistory.lastSevenDays },
        { key: 'lastThirtyDays', label: 'Last 30 Days', items: groupedChatHistory.lastThirtyDays },
        { key: 'older', label: 'Older', items: groupedChatHistory.older },
      ].filter(group => group.items.length > 0),
    [groupedChatHistory],
  )

  function isActiveChat(chatId: number) {
    return route('chats.show', chatId, false) === page.url
  }

  return (
    <div>
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            {mainMenuItems.map(item => (
              <SidebarMenuButton
                key={item.label}
                asChild
                className="flex items-center font-semibold mb-1"
              >
                {item.external ? (
                  <a
                    href={item.href}
                    target={item.target}
                    aria-label={item.label}
                    className="flex items-center"
                  >
                    <Icon icon={item.icon} className="size-4" />
                    <span className="ml-2">{item.label}</span>
                  </a>
                ) : (
                  <Link href={item.href} aria-label={item.label} className="flex items-center">
                    <Icon icon={item.icon} className="size-4" />
                    <span className="ml-2">{item.label}</span>
                  </Link>
                )}
              </SidebarMenuButton>
            ))}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      {isGuest && !hasAnyHistory && (
        <div className="px-4 py-2 text-sm text-muted-foreground">
          Please login to see your chat history
        </div>
      )}

      {hasAnyHistory && (
        <div role="navigation" aria-label="Chat History Navigation">
          {isGuest && (
            <SidebarGroupLabel>
              To view chat history please login
            </SidebarGroupLabel>
          )}

          {chatHistoryGroups.map(group => (
            <SidebarGroup key={group.key} className="px-2 py-0">
              {!isGuest && (
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              )}
              <SidebarMenu>
                {group.items.map(historyItem => (
                  <SidebarMenuItem key={`chat-${historyItem.id}`}>
                    <SidebarMenuButton
                      asChild
                      className={
                        isActiveChat(historyItem.id)
                          ? 'bg-secondary text-secondary-foreground'
                          : ''
                      }
                      tooltip={historyItem.title}
                    >
                      <Link
                        href={route('chats.show', historyItem.id)}
                        aria-label={`Open chat: ${historyItem.title}`}
                        className="block w-full"
                      >
                        <span className="truncate">{historyItem.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ))}

          <SidebarGroupLabel className="mt-2 text-muted-foreground" role="status">
            <span>You have reached the end of your chat history.</span>
          </SidebarGroupLabel>
        </div>
      )}
    </div>
  )
}
