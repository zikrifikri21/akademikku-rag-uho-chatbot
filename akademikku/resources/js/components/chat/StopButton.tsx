import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'

interface StopButtonProps {
  onClick?: () => void
}

export function StopButton({ onClick }: StopButtonProps) {
  return (
    <Button
      type="button"
      size="icon"
      onClick={onClick}
      className="size-8 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all"
    >
      <Icon icon="lucide:square" className="size-3.5 fill-current" />
      <span className="sr-only">Stop</span>
    </Button>
  )
}
