import type { Message, MessageParts } from '@/types'
import { ContentType } from '@/types/enum'
import { useMemo } from 'react'

export function useMessageFormatting(message: Message) {
  const messageParts = useMemo<MessageParts[]>(() => {
    const parts: MessageParts[] = []

    if (message.parts[ContentType.THINKING]) {
      parts.push({
        [ContentType.THINKING]: message.parts[ContentType.THINKING],
      })
    }

    if (message.parts[ContentType.TEXT]) {
      parts.push({
        [ContentType.TEXT]: message.parts[ContentType.TEXT],
      })
    }

    return parts
  }, [message.parts])

  const hasThinking = useMemo<boolean>(
    () => !!message.parts[ContentType.THINKING],
    [message.parts],
  )
  const hasText = useMemo<boolean>(
    () => !!message.parts[ContentType.TEXT],
    [message.parts],
  )

  return {
    messageParts,
    hasThinking,
    hasText,
  }
}
