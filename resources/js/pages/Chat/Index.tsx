import type { BreadcrumbItemType, ChatHistory, Model } from '@/types'
import { Visibility } from '@/types/enum'
import { Head, router } from '@inertiajs/react'
import { ChatContainer } from '@/components/chat/ChatContainer'
import { MODEL_KEY } from '@/constants/models'
import { useAuth } from '@/hooks/useAuth'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import AppLayout from '@/layouts/AppLayout'

interface IndexProps {
  chatHistory?: ChatHistory
  availableModels: Model[]
}

export default function Index({ chatHistory, availableModels }: IndexProps) {
  const { isGuest } = useAuth()
  const [selectedModel] = useLocalStorage<Model>(MODEL_KEY, availableModels[0])

  const breadcrumbs: BreadcrumbItemType[] = [
    {
      title: 'Chat',
      href: route('chats.index'),
    },
  ]

  function handleSubmit() {
    if (isGuest)
      return
  }

  function handleAppend(message: string) {
    if (isGuest)
      return

    router.post(route('chats.store'), {
      message,
      model: selectedModel?.id || availableModels[0]?.id,
      visibility: Visibility.PRIVATE,
    })
  }

  return (
    <>
      <Head title="Chat" />
      <AppLayout breadcrumbs={breadcrumbs} chatHistory={chatHistory}>
        <div className="h-[calc(100vh-4rem)] bg-background">
          <ChatContainer
            isReadonly={isGuest}
            handleSubmit={handleSubmit}
            append={handleAppend}
          />
        </div>
      </AppLayout>
    </>
  )
}
