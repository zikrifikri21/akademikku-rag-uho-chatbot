import type { Chat, Model, SharedData } from '@/types'
import { Role } from '@/types/enum'
import { useEffect, useRef } from 'react'
import { usePage } from '@inertiajs/react'
import { ChatHeader } from '@/components/chat/ChatHeader'
import { Greeting } from '@/components/chat/Greeting'
import { Messages } from '@/components/chat/Messages'
import { MultimodalInput } from '@/components/chat/MultimodalInput'
import { SuggestedActions } from '@/components/chat/SuggestedActions'
import { MODEL_KEY } from '@/constants/models'
import { ChatInputProvider, useChatInput } from '@/hooks/useChatInput'
import { useChatMessages } from '@/hooks/useChatMessages'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useMessageStream } from '@/hooks/useMessageStream'
import { VisibilityProvider } from '@/hooks/useVisibility'

interface ChatContainerProps {
  chat?: Chat
  isReadonly?: boolean
  isGuest?: boolean
  append?: (message: string) => void
  prompt?: string
}

function ChatContent({
  chat,
  isReadonly = false,
  isGuest = false,
  append,
  prompt,
}: ChatContainerProps) {
  const { props } = usePage<SharedData>()
  const availableModels = props.availableModels || []
  const [selectedModel] = useLocalStorage<Model>(
    MODEL_KEY,
    availableModels[0],
  )
  const { input, clearInput } = useChatInput()
  const messagesRef = useRef<{ scrollToBottom: () => void } | null>(null)

  const { messages, setMessages, addTextMessage } = useChatMessages(chat, () => {
    messagesRef.current?.scrollToBottom()
  })

  // Restore guest messages from sessionStorage on initial load if guest
  useEffect(() => {
    if (isGuest && !chat?.id && typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('guest_chat_messages')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed)
          }
        }
      }
      catch (e) {
        console.error('Error restoring guest chat messages:', e)
      }
    }
  }, [isGuest, chat?.id])

  // Save guest messages to sessionStorage whenever they change
  useEffect(() => {
    if (isGuest && !chat?.id && typeof window !== 'undefined') {
      if (messages.length > 0) {
        sessionStorage.setItem('guest_chat_messages', JSON.stringify(messages))
      }
    }
  }, [isGuest, chat?.id, messages])

  // Handle hard refresh (Ctrl+Shift+R, Ctrl+F5, Shift+F5) to clear guest chat data
  useEffect(() => {
    if (!isGuest || typeof window === 'undefined')
      return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'r')
        || (e.key === 'F5' && e.shiftKey)
        || ((e.ctrlKey || e.metaKey) && e.key === 'F5')) {
        sessionStorage.removeItem('guest_chat_messages')
      }
    }

    // Also check performance navigation type if hard reload occurred
    try {
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
      if (navEntries.length > 0 && navEntries[0].type === 'reload') {
        if (sessionStorage.getItem('guest_hard_reset') === 'true') {
          sessionStorage.removeItem('guest_chat_messages')
          sessionStorage.removeItem('guest_hard_reset')
          setMessages([])
        }
      }
    }
    catch (e) {
      // ignore
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isGuest])

  const { isStreaming, stop, submit } = useMessageStream(
    chat?.id ? String(chat.id) : '',
    setMessages,
    () => {
      messagesRef.current?.scrollToBottom()
    },
    isGuest,
  )

  const hasStreamedPrompt = useRef(false)
  useEffect(() => {
    if (prompt && !hasStreamedPrompt.current && chat?.id) {
      hasStreamedPrompt.current = true
      addTextMessage(prompt)
      submit({
        message: prompt,
        model: selectedModel?.id || availableModels[0]?.id || 'openai/gpt-oss-20b',
      })
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', route('chats.show', { chat: chat.id }))
      }
    }
  }, [prompt, chat?.id])

  const handleFormSubmit = () => {
    if (!input.trim() || isStreaming || isReadonly)
      return

    const messageText = input.trim()
    clearInput()

    if (append) {
      addTextMessage(messageText)
      setMessages(prev => [...prev, { role: Role.ASSISTANT, parts: {} }])
      append(messageText)
    }
    else if (chat?.id) {
      addTextMessage(messageText)
      submit({
        message: messageText,
        model: selectedModel?.id || availableModels[0]?.id || 'openai/gpt-oss-20b',
      })
    }
    else if (isGuest) {
      const userMsg = addTextMessage(messageText)
      submit({
        message: messageText,
        model: selectedModel?.id || availableModels[0]?.id || 'openai/gpt-oss-20b',
        history: [...messages, userMsg],
      })
    }
  }

  const handleAppend = (text: string) => {
    if (append) {
      addTextMessage(text)
      setMessages(prev => [...prev, { role: Role.ASSISTANT, parts: {} }])
      append(text)
    }
    else if (chat?.id) {
      addTextMessage(text)
      submit({
        message: text,
        model: selectedModel?.id || availableModels[0]?.id || 'openai/gpt-oss-20b',
      })
    }
    else if (isGuest) {
      const userMsg = addTextMessage(text)
      submit({
        message: text,
        model: selectedModel?.id || availableModels[0]?.id || 'openai/gpt-oss-20b',
        history: [...messages, userMsg],
      })
    }
  }

  return (
    <VisibilityProvider initialVisibility={chat?.visibility}>
      <div className="flex flex-col h-full w-full bg-background relative overflow-hidden">
        <ChatHeader
          chatId={chat?.id ? String(chat.id) : ''}
          selectedModelId={selectedModel?.id || availableModels[0]?.id || ''}
          selectedVisibilityType={chat?.visibility!}
          isReadonly={isReadonly}
          isGuest={isGuest}
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
  )
}

export function ChatContainer(props: ChatContainerProps) {
  return (
    <ChatInputProvider>
      <ChatContent {...props} />
    </ChatInputProvider>
  )
}
