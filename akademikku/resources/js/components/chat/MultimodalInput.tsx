import { useEffect, useRef } from 'react'
import { SendButton } from '@/components/chat/SendButton'
import { StopButton } from '@/components/chat/StopButton'
import { Textarea } from '@/components/ui/textarea'
import { useChatInput } from '@/hooks/useChatInput'

interface MultimodalInputProps {
  isLoading?: boolean
  isReadonly?: boolean
  onSubmit?: () => void
  onStop?: () => void
}

export function MultimodalInput({
  isLoading = false,
  isReadonly = false,
  onSubmit,
  onStop,
}: MultimodalInputProps) {
  const { input, setInput } = useChatInput()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto resize textarea height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isLoading && !isReadonly) {
        onSubmit?.()
      }
    }
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto p-4 pt-2">
      {/* 40% -> 0% Opacity Fade Gradient Overlay */}
      <div className="absolute -top-10 left-0 right-0 h-10 pointer-events-none bg-gradient-to-t from-background via-background/40 to-transparent z-10" />

      <div className="relative flex flex-col w-full rounded-2xl border bg-background shadow-sm focus-within:ring-1 focus-within:ring-ring p-3 space-y-2 z-10">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isReadonly ? 'Please login to send messages...' : 'Send a message...'}
          disabled={isReadonly}
          rows={1}
          className="min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent p-1 text-sm focus-visible:ring-0 shadow-none overflow-y-auto"
        />

        <div className="flex items-center justify-end pt-2">
          <div className="flex items-center gap-2">
            {isLoading ? (
              <StopButton onClick={onStop} />
            ) : (
              <SendButton
                disabled={!input.trim() || isReadonly}
                onClick={() => onSubmit?.()}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
