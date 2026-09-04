import type { BreadcrumbItemType, Chat, ChatHistory } from '@/types'
import { Head } from '@inertiajs/react'
import { ChatContainer } from '@/components/chat/ChatContainer'
import { useAuth } from '@/hooks/useAuth'
import AppLayout from '@/layouts/AppLayout'

interface ShowProps {
  chat: Chat
  chatHistory?: ChatHistory
  prompt?: string
}

export default function Show({ chat, chatHistory, prompt }: ShowProps) {
  const { isGuest } = useAuth()

  const breadcrumbs: BreadcrumbItemType[] = [
    {
      title: 'Chat',
      href: route('chats.index'),
    },
    {
      title: chat.title || 'Conversation',
      href: route('chats.show', chat.id),
    },
  ]

  return (
    <>
      <Head title={chat.title || 'Chat'} />
      <AppLayout breadcrumbs={breadcrumbs} chatHistory={chatHistory}>
        <div className="h-[calc(100vh-4rem)] bg-background">
          <ChatContainer chat={chat} isReadonly={isGuest} prompt={prompt} />
        </div>
      </AppLayout>
    </>
  )
}
