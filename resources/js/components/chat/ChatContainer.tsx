import type { Chat } from '@/types'
import { useRef } from 'react'
import { ChatHeader } from '@/components/chat/ChatHeader'
import { Greeting } from '@/components/chat/Greeting'
import { Messages } from '@/components/chat/Messages'
import { MultimodalInput } from '@/components/chat/MultimodalInput'
import { SuggestedActions } from '@/components/chat/SuggestedActions'
import { ChatInputProvider } from '@/hooks/useChatInput'
import { useChatMessages } from '@/hooks/useChatMessages'
import { useMessageStream } from '@/hooks/useMessageStream'
import { VisibilityProvider } from '@/hooks/useVisibility'

interface ChatContainerProps {
  chat?: Chat
  isReadonly?: boolean
  handleSubmit?: () => void
  append?: (message: string) => void
}

export function ChatContainer({
  chat,
  isReadonly = false,
  handleSubmit,
  append,
}: ChatContainerProps) {
  const messagesRef = useRef<{ scrollToBottom: () => void } | null>(null)
  const { messages, setMessages } = useChatMessages(chat, () => {
    messagesRef.current?.scrollToBottom()
  })

  const { isStreaming, stop } = useMessageStream(
    chat?.id ? String(chat.id) : '',
    setMessages,
    () => {
      messagesRef.current?.scrollToBottom()
    },
  )

  const handleAppend = (text: string) => {
    if (append) {
      append(text)
    }
  }

  const handleFormSubmit = () => {
    if (handleSubmit) {
      handleSubmit()
    }
  }

  return (
    <ChatInputProvider>
      <VisibilityProvider initialVisibility={chat?.visibility}>
        <div className="flex flex-col h-full w-full bg-background relative overflow-hidden">
          <ChatHeader
            chatId={chat?.id ? String(chat.id) : ''}
            selectedModelId={chat?.model || ''}
            selectedVisibilityType={chat?.visibility!}
            isReadonly={isReadonly}
          />

          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col justify-between overflow-y-auto">
              <Greeting />
              <SuggestedActions onAppend={handleAppend} />
            </div>
          ) : (
            <Messages
              ref={messagesRef}
              messages={messages}
              chatId={chat?.id ? String(chat.id) : undefined}
              isLoading={isStreaming}
            />
          )}

          <MultimodalInput
            isLoading={isStreaming}
            isReadonly={isReadonly}
            onSubmit={handleFormSubmit}
            onStop={stop}
          />
        </div>
      </VisibilityProvider>
    </ChatInputProvider>
  )
}
