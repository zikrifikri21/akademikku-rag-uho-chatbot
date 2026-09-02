import type { Attachment } from '@/types'
import { useRef, useState } from 'react'
import { AttachmentsButton } from '@/components/chat/AttachmentsButton'
import { PreviewAttachment } from '@/components/chat/PreviewAttachment'
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
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isLoading && !isReadonly) {
        onSubmit?.()
      }
    }
  }

  const handleFileSelect = (files: FileList) => {
    const newAttachments: Attachment[] = Array.from(files).map((file, i) => ({
      id: `${Date.now()}-${i}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
    }))
    setAttachments(prev => [...prev, ...newAttachments])
  }

  const removeAttachment = (id?: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id))
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto p-4">
      <div className="relative flex flex-col w-full rounded-2xl border bg-background shadow-sm focus-within:ring-1 focus-within:ring-ring p-3 space-y-2">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-2 border-b">
            {attachments.map(att => (
              <PreviewAttachment
                key={att.id}
                attachment={att}
                onRemove={() => removeAttachment(att.id)}
              />
            ))}
          </div>
        )}

        <Textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isReadonly ? 'Please login to send messages...' : 'Send a message...'}
          disabled={isReadonly}
          rows={1}
          className="min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent p-1 text-sm focus-visible:ring-0 shadow-none"
        />

        <div className="flex items-center justify-between pt-2">
          <AttachmentsButton onFileSelect={handleFileSelect} disabled={isReadonly || isLoading} />

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
