import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useVisibility } from '@/hooks/useVisibility'
import { Visibility } from '@/types/enum'

interface VisibilitySelectorProps {
  className?: string
}

export function VisibilitySelector({ className = '' }: VisibilitySelectorProps) {
  const { visibility, setVisibility } = useVisibility()

  const visibilityTypes = [
    {
      id: Visibility.PRIVATE,
      name: 'Private',
      description: 'Only you can see this chat',
      icon: 'lucide:lock',
    },
    {
      id: Visibility.PUBLIC,
      name: 'Public',
      description: 'Anyone with the link can see this chat',
      icon: 'lucide:globe',
    },
  ]

  const selectedVisibility = visibilityTypes.find(v => v.id === visibility)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`md:px-2 md:h-[34px] ${className}`}
        >
          <Icon icon={selectedVisibility?.icon || 'lucide:lock'} />
          <span className="md:inline">{selectedVisibility?.name}</span>
          <Icon icon="lucide:chevron-down" className="ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[250px]">
        {visibilityTypes.map(v => (
          <DropdownMenuItem
            key={v.id}
            onSelect={() => setVisibility(v.id)}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Icon icon={v.icon} />
              <div className="flex flex-col">
                <span>{v.name}</span>
                <span className="text-xs text-muted-foreground">{v.description}</span>
              </div>
            </div>
            {v.id === visibility && (
              <Icon icon="lucide:check-circle" className="ml-auto" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
