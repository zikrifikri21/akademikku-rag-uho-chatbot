import type { Attachment, Message as MessageType } from '@/types'
import { ContentType, Role } from '@/types/enum'
import { motion } from 'framer-motion'
import { Icon } from '@/components/Icon'
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer'
import { MessageActions } from '@/components/chat/MessageActions'
import { PreviewAttachment } from '@/components/chat/PreviewAttachment'
import { ReasoningDisplay } from '@/components/chat/ReasoningDisplay'
import { useMessageFormatting } from '@/hooks/useMessageFormatting'

interface MessageProps {
  message: MessageType
  chatId?: string
  isLoading?: boolean
}

export function Message({ message, chatId, isLoading = false }: MessageProps) {
  const { messageParts } = useMessageFormatting(message)
  const isUser = message.role === Role.USER

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`group flex gap-3 py-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div
        className={`flex size-8 shrink-0 select-none items-center justify-center rounded-full border shadow-sm ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        <Icon icon={isUser ? 'lucide:user' : 'lucide:bot'} className="size-4" />
      </div>

      <div
        className={`flex max-w-[85%] flex-col gap-2 ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.attachments.map((att: Attachment, i: number) => (
              <PreviewAttachment key={att.id || i} attachment={att} />
            ))}
          </div>
        )}

        {messageParts.map((part, index) => {
          const thinkingText = part[ContentType.THINKING]
          const bodyText = part[ContentType.TEXT]

          return (
            <div key={index} className="w-full">
              {thinkingText && <ReasoningDisplay reasoning={thinkingText} isLoading={isLoading} />}
              {bodyText && (
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm ${
                    isUser
                      ? 'bg-primary text-primary-foreground [&_*]:!text-primary-foreground rounded-tr-none shadow-sm'
                      : 'bg-muted/60 text-foreground rounded-tl-none border border-border/40'
                  }`}
                >
                  <MarkdownRenderer content={bodyText} isUser={isUser} />
                </div>
              )}
            </div>
          )
        })}

        {!isUser && isLoading && !message.parts[ContentType.TEXT] && (
          <div className="flex items-center gap-2 rounded-2xl rounded-tl-none border border-border/40 bg-muted/60 px-4 py-2.5 text-xs text-muted-foreground">
            <Icon icon="lucide:brain" className="size-4 animate-pulse text-primary" />
            <span className="font-medium animate-pulse">Sedang berpikir...</span>
          </div>
        )}

        {!isUser && message.parts[ContentType.TEXT] && (
          <MessageActions
            message={message}
            chatId={chatId}
            textToCopy={message.parts[ContentType.TEXT]}
          />
        )}
      </div>
    </motion.div>
  )
}
