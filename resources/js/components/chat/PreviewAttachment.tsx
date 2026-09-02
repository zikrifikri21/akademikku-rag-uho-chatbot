import type { Attachment } from '@/types'
import { X } from 'lucide-react'
import { Icon } from '@/components/Icon'

interface PreviewAttachmentProps {
  attachment: Attachment
  onRemove?: () => void
}

export function PreviewAttachment({ attachment, onRemove }: PreviewAttachmentProps) {
  const isImage = attachment.type?.startsWith('image/') || attachment.url?.match(/\.(jpeg|jpg|gif|png|webp)$/i)

  return (
    <div className="relative group flex items-center gap-2 rounded-lg border bg-muted/50 p-2 pr-3 text-xs">
      {isImage ? (
        <img
          src={attachment.url}
          alt={attachment.name || 'Attachment'}
          className="size-8 rounded object-cover"
        />
      ) : (
        <div className="flex size-8 items-center justify-center rounded bg-primary/10 text-primary">
          <Icon icon="lucide:file" className="size-4" />
        </div>
      )}

      <div className="flex flex-col truncate">
        <span className="truncate font-medium">{attachment.name || 'File'}</span>
        {attachment.size && (
          <span className="text-[10px] text-muted-foreground">
            {(attachment.size / 1024).toFixed(1)} KB
          </span>
        )}
      </div>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
        >
          <X className="size-3" />
          <span className="sr-only">Remove</span>
        </button>
      )}
    </div>
  )
}
