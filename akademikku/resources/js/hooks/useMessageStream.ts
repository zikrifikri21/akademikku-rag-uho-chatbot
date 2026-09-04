import type { Message, StreamEvent } from '@/types'
import { ContentType, Role, StreamEventType } from '@/types/enum'
import { useStream } from '@laravel/stream-react'
import type { Dispatch, SetStateAction } from 'react'
import { useState } from 'react'

interface StreamParams {
  message: string
  model: string
  history?: Message[]
}

export function useMessageStream(
  chatId: string,
  setMessages: Dispatch<SetStateAction<Message[]>>,
  onComplete?: () => void,
  isGuest = false,
) {
  const [isPending, setIsPending] = useState(false)

  const updateMessageWithEvent = (eventData: StreamEvent): void => {
    setIsPending(false)
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

      let textChunk = ''
      const rawContent = eventData.content ?? (eventData as any).delta ?? (eventData as any).thinking ?? (eventData as any).text

      if (typeof rawContent === 'string') {
        textChunk = rawContent
      }
      else if (Array.isArray(rawContent)) {
        textChunk = rawContent
          .map(c => (typeof c === 'string' ? c : (c?.text || c?.thinking || c?.content || c?.delta || JSON.stringify(c))))
          .join('')
      }
      else if (typeof rawContent === 'object' && rawContent !== null) {
        const obj = rawContent as Record<string, any>
        textChunk = obj.text || obj.thinking || obj.content || obj.delta || JSON.stringify(obj)
      }
      else if (rawContent !== undefined && rawContent !== null) {
        textChunk = String(rawContent)
      }

      if (!currentMessage.parts[contentType]) {
        currentMessage.parts[contentType] = ''
      }

      currentMessage.parts[contentType] += textChunk
      return messages
    })
  }

  const parseStreamChunk = (chunk: string): void => {
    setIsPending(false)
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
    setIsPending(false)
    setMessages((prev) => {
      const messages = [...prev]
      const lastMessage = messages[messages.length - 1]

      const errorMessage = {
        role: Role.ASSISTANT,
        parts: {
          [ContentType.TEXT]:
            'Sorry, there was an error processing your request. Please try again.',
        },
      }

      if (lastMessage && lastMessage.role === Role.ASSISTANT && !lastMessage.parts[ContentType.TEXT] && !lastMessage.parts[ContentType.THINKING]) {
        messages[messages.length - 1] = errorMessage
      }
      else {
        messages.push(errorMessage)
      }

      return messages
    })
  }

  const handleFinish = (): void => {
    setIsPending(false)
    onComplete?.()
  }

  const isServer = typeof window === 'undefined'

  const dummyStream = {
    isStreaming: false,
    send: (_params?: StreamParams) => {},
    cancel: () => {},
  } as unknown as ReturnType<typeof useStream<StreamParams, StreamEvent>>

  const streamUrl = isGuest || !chatId
    ? route('chat.stream-guest')
    : route('chat.stream', { chat: chatId })

  const stream = !isServer
    ? useStream<StreamParams, StreamEvent>(
        streamUrl,
        {
          onData: parseStreamChunk,
          onError: handleStreamError,
          onFinish: handleFinish,
        },
      )
    : dummyStream

  const submit = (params: StreamParams) => {
    setIsPending(true)
    setMessages((prev) => {
      const messages = [...prev]
      const lastMessage = messages[messages.length - 1]
      if (!lastMessage || lastMessage.role !== Role.ASSISTANT) {
        messages.push({
          role: Role.ASSISTANT,
          parts: {},
        })
      }
      return messages
    })
    stream.send(params)
  }

  const stop = () => {
    setIsPending(false)
    stream.cancel()
  }

  return {
    ...stream,
    isStreaming: stream.isStreaming || isPending,
    submit,
    stop,
    updateMessageWithEvent,
  }
}
