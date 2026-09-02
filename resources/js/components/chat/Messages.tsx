import type { Message as MessageType } from '@/types'
import { forwardRef, useImperativeHandle } from 'react'
import { Message } from '@/components/chat/Message'
import { ThinkingMessage } from '@/components/chat/ThinkingMessage'
import { useScrollToBottom } from '@/hooks/useScrollToBottom'

interface MessagesProps {
  messages: MessageType[]
  chatId?: string
  isLoading?: boolean
}

export interface MessagesHandle {
  scrollToBottom: () => void
}

export const Messages = forwardRef<MessagesHandle, MessagesProps>(
  ({ messages, chatId, isLoading = false }, ref) => {
    const { containerRef, scrollToBottomSmooth } = useScrollToBottom()

    useImperativeHandle(ref, () => ({
      scrollToBottom: () => {
        scrollToBottomSmooth()
      },
    }))

    return (
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-2 scroll-smooth"
      >
        <div className="max-w-3xl mx-auto flex flex-col justify-end min-h-full">
          {messages.map((message, index) => (
            <Message
              key={message.id || index}
              message={message}
              chatId={chatId}
              isLoading={isLoading && index === messages.length - 1}
            />
          ))}

          {isLoading && <ThinkingMessage />}
        </div>
      </div>
    )
  },
)

Messages.displayName = 'Messages'
