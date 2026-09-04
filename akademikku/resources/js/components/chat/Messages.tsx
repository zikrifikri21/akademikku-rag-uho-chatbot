import type { Message as MessageType } from '@/types'
import { Role } from '@/types/enum'
import { forwardRef, useEffect, useImperativeHandle } from 'react'
import { Icon } from '@/components/Icon'
import { Message } from '@/components/chat/Message'
import { ThinkingMessage } from '@/components/chat/ThinkingMessage'
import { Button } from '@/components/ui/button'
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
    const { containerRef, isAtBottom, scrollToBottomInstant, scrollToBottomSmooth } = useScrollToBottom()

    useImperativeHandle(ref, () => ({
      scrollToBottom: () => {
        scrollToBottomSmooth()
      },
    }))

    // Auto scroll on every chunk during AI streaming or when new message is added
    useEffect(() => {
      if (isLoading) {
        scrollToBottomInstant()
      }
      else {
        scrollToBottomSmooth()
      }
    }, [messages, isLoading, scrollToBottomInstant, scrollToBottomSmooth])

    return (
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={containerRef}
          className="h-full overflow-y-auto px-4 md:px-6 py-4 space-y-2 scroll-smooth"
        >
          <div className="max-w-3xl mx-auto flex flex-col justify-end min-h-full pb-2">
            {messages.map((message, index) => (
              <Message
                key={message.id || index}
                message={message}
                chatId={chatId}
                isLoading={isLoading && index === messages.length - 1}
              />
            ))}

            {isLoading && messages[messages.length - 1]?.role !== Role.ASSISTANT && (
              <ThinkingMessage />
            )}
          </div>
        </div>

        {!isAtBottom && (
          <Button
            variant="outline"
            size="icon"
            className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full shadow-md z-20 bg-background/80 backdrop-blur border hover:bg-accent transition-all"
            onClick={() => scrollToBottomSmooth()}
            aria-label="Scroll to bottom"
          >
            <Icon icon="lucide:arrow-down" className="size-4" />
          </Button>
        )}
      </div>
    )
  },
)

Messages.displayName = 'Messages'
