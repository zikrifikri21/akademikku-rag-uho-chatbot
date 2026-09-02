import { Icon } from '@/components/Icon'

export function ThinkingMessage() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse py-2">
      <Icon icon="lucide:loader-2" className="size-4 animate-spin" />
      <span>Thinking...</span>
    </div>
  )
}
