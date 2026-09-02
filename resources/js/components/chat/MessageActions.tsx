import type { Message } from '@/types'
import { useState } from 'react'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { useMessageVoting } from '@/hooks/useMessageVoting'

interface MessageActionsProps {
  message: Message
  chatId?: string
  textToCopy?: string
}

export function MessageActions({ message, chatId, textToCopy = '' }: MessageActionsProps) {
  const [copied, setCopied] = useState(false)
  const { isUpvoted, isDownvoted, isProcessing, upvoteMessage, downvoteMessage } =
    useMessageVoting(message, chatId)

  const handleCopy = async () => {
    if (!textToCopy)
      return
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
    catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        variant="ghost"
        size="icon"
        className="size-7 rounded text-muted-foreground hover:text-foreground"
        onClick={handleCopy}
      >
        <Icon icon={copied ? 'lucide:check' : 'lucide:copy'} className="size-3.5" />
        <span className="sr-only">Copy message</span>
      </Button>

      {chatId && (
        <>
          <Button
            variant="ghost"
            size="icon"
            disabled={isProcessing}
            onClick={upvoteMessage}
            className={`size-7 rounded ${isUpvoted ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Icon icon="lucide:thumbs-up" className="size-3.5" />
            <span className="sr-only">Upvote</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            disabled={isProcessing}
            onClick={downvoteMessage}
            className={`size-7 rounded ${isDownvoted ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Icon icon="lucide:thumbs-down" className="size-3.5" />
            <span className="sr-only">Downvote</span>
          </Button>
        </>
      )}
    </div>
  )
}
