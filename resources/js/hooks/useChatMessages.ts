import type { Chat, Message, MessageParts } from '@/types'
import { ContentType, Role } from '@/types/enum'
import { useCallback, useEffect, useState } from 'react'

export function useChatMessages(chat?: Chat | null, scrollFn?: () => void) {
  const [messages, setMessages] = useState<Message[]>(() => {
    return (
      chat?.messages?.map(message => ({
        ...message,
        attachments:
          typeof message.attachments === 'string'
            ? JSON.parse(message.attachments)
            : message.attachments,
      })) || []
    )
  })

  useEffect(() => {
    if (chat?.messages && chat.messages.length > 0) {
      setMessages(
        chat.messages.map(message => ({
          ...message,
          attachments:
            typeof message.attachments === 'string'
              ? JSON.parse(message.attachments)
              : message.attachments,
        })),
      )
      scrollFn?.()
    }
  }, [chat?.messages])

  const addUserMessage = useCallback((content: MessageParts): Message => {
    const userMessage: Message = {
      role: Role.USER,
      parts: content,
      attachments: [],
    }
    setMessages(prev => [...prev, userMessage])
    return userMessage
  }, [])

  const addTextMessage = useCallback(
    (text: string): Message => {
      return addUserMessage({ [ContentType.TEXT]: text })
    },
    [addUserMessage],
  )

  const getLastMessage = useCallback((): Message | undefined => {
    return messages[messages.length - 1]
  }, [messages])

  const isLastMessageFromUser = useCallback((): boolean => {
    const lastMessage = getLastMessage()
    return lastMessage?.role === Role.USER
  }, [getLastMessage])

  return {
    messages,
    setMessages,
    addUserMessage,
    addTextMessage,
    getLastMessage,
    isLastMessageFromUser,
  }
}
