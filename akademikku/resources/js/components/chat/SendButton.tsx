import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'

interface SendButtonProps {
  disabled?: boolean
  onClick?: () => void
}

export function SendButton({ disabled = false, onClick }: SendButtonProps) {
  return (
    <Button
      type="submit"
      size="icon"
      disabled={disabled}
      onClick={onClick}
      className="size-8 rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
    >
      <Icon icon="lucide:arrow-up" className="size-4" />
      <span className="sr-only">Send</span>
    </Button>
  )
}
