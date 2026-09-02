import React, { createContext, useContext } from 'react'
import { useLocalStorage } from './useLocalStorage'

interface ChatInputState {
  input: string
  setInput: (value: string) => void
  clearInput: () => void
}

const ChatInputContext = createContext<ChatInputState | null>(null)

export function ChatInputProvider({ children }: { children: React.ReactNode }) {
  const [input, setInput] = useLocalStorage<string>('chat-input', '')

  const clearInput = () => {
    setInput('')
  }

  const value: ChatInputState = {
    input,
    setInput,
    clearInput,
  }

  return (
    <ChatInputContext.Provider value={value}>
      {children}
    </ChatInputContext.Provider>
  )
}

export function useChatInput(): ChatInputState {
  const context = useContext(ChatInputContext)
  if (!context) {
    throw new Error('useChatInput must be used within a ChatInputProvider')
  }
  return context
}
