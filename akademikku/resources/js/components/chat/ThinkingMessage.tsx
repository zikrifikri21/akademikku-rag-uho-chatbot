import { Icon } from '@/components/Icon'

export function ThinkingMessage() {
  return (
    <div className="flex gap-3 py-4">
      <div className="flex size-8 shrink-0 select-none items-center justify-center rounded-full border shadow-sm bg-muted text-muted-foreground">
        <Icon icon="lucide:bot" className="size-4" />
      </div>
      <div className="flex items-center gap-2 rounded-2xl rounded-tl-none border border-border/40 bg-muted/60 px-4 py-2.5 text-xs text-muted-foreground">
        <Icon icon="lucide:brain" className="size-4 animate-pulse text-primary" />
        <span className="font-medium animate-pulse">Sedang berpikir...</span>
      </div>
    </div>
  )
}
