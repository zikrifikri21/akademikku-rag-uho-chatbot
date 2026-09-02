import type { Message, StreamEvent } from '@/types'
import { ContentType, Role, StreamEventType } from '@/types/enum'
import { useStream } from '@laravel/stream-react'
import type { Dispatch, SetStateAction } from 'react'

interface StreamParams {
  message: string
  model: string
}

export function useMessageStream(
  chatId: string,
  setMessages: Dispatch<SetStateAction<Message[]>>,
  onComplete?: () => void,
) {
  const updateMessageWithEvent = (eventData: StreamEvent): void => {
    setMessages((prevMessages) => {
      const messages = [...prevMessages]
      let currentMessage = messages[messages.length - 1]

      if (!currentMessage || currentMessage.role !== Role.ASSISTANT) {
        currentMessage = {
          role: Role.ASSISTANT,
          parts: {},
        }
        messages.push(currentMessage)
      }
      else {
        currentMessage = {
          ...currentMessage,
          parts: { ...currentMessage.parts },
        }
        messages[messages.length - 1] = currentMessage
      }

      const contentType
        = eventData.eventType === StreamEventType.TEXT_DELTA
          ? ContentType.TEXT
          : ContentType.THINKING

      if (!currentMessage.parts[contentType]) {
        currentMessage.parts[contentType] = ''
      }

      currentMessage.parts[contentType] += eventData.content
      return messages
    })
  }

  const parseStreamChunk = (chunk: string): void => {
    const lines = chunk
      .trim()
      .split('\n')
      .filter(line => line.trim())

    for (const line of lines) {
      try {
        const eventData = JSON.parse(line) as StreamEvent
        if (eventData.eventType !== StreamEventType.ERROR) {
          updateMessageWithEvent(eventData)
        }
      }
      catch (error) {
        console.error('Failed to parse JSON line:', error, 'Line:', line)
      }
    }
  }

  const handleStreamError = (): void => {
    setMessages(prev => [
      ...prev,
      {
        role: Role.ASSISTANT,
        parts: {
          [ContentType.TEXT]:
            'Sorry, there was an error processing your request. Please try again.',
        },
      },
    ])
  }

  const isServer = typeof window === 'undefined'

  const dummyStream = {
    isStreaming: false,
    submit: () => {},
    stop: () => {},
  }

  const stream = !isServer
    ? useStream<StreamParams, StreamEvent>(
        route('chat.stream', { chat: chatId }),
        {
          onData: parseStreamChunk,
          onError: handleStreamError,
          onFinish: onComplete,
        },
      )
    : dummyStream

  return {
    ...stream,
    updateMessageWithEvent,
  }
}
