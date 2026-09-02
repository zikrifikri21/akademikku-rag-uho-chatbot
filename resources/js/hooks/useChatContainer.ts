import { useRef, useState } from 'react'

export interface MessagesRefHandle {
  scrollToBottom: () => void
}

export function useChatContainer() {
  const [isAtBottom, setIsAtBottom] = useState(false)
  const messagesRef = useRef<MessagesRefHandle | null>(null)

  const handleScrollToBottom = (): void => {
    messagesRef.current?.scrollToBottom()
  }

  const updateIsAtBottom = (value: boolean): void => {
    setIsAtBottom(value)
  }

  return {
    isAtBottom,
    messagesRef,
    handleScrollToBottom,
    updateIsAtBottom,
  }
}
