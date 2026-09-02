import { useCallback, useEffect, useRef, useState } from 'react'

export function useScrollToBottom() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  const handleScroll = useCallback(() => {
    if (!containerRef.current)
      return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const atBottom = scrollHeight - scrollTop - clientHeight < 50
    setIsAtBottom(atBottom)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el)
      return
    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (!containerRef.current)
      return
    const maxScrollTop
      = containerRef.current.scrollHeight - containerRef.current.clientHeight
    containerRef.current.scrollTo({
      top: maxScrollTop,
      behavior,
    })
  }, [])

  const scrollToBottomInstant = useCallback(() => {
    scrollToBottom('auto')
  }, [scrollToBottom])

  const scrollToBottomSmooth = useCallback(() => {
    scrollToBottom('smooth')
  }, [scrollToBottom])

  return {
    containerRef,
    isAtBottom,
    scrollToBottom,
    scrollToBottomInstant,
    scrollToBottomSmooth,
  }
}
