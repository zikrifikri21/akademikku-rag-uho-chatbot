import type { Model, SharedData } from '@/types'
import { usePage } from '@inertiajs/react'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MODEL_KEY } from '@/constants/models'
import { useLocalStorage } from '@/hooks/useLocalStorage'

interface ModelSelectorProps {
  className?: string
}

export function ModelSelector({ className = '' }: ModelSelectorProps) {
  const { props } = usePage<SharedData>()
  const availableModels = props.availableModels || []

  const [selectedModel, setSelectedModel] = useLocalStorage<Model>(
    MODEL_KEY,
    availableModels[0],
  )

  function selectModel(model: Model) {
    setSelectedModel(model)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          data-testid="model-selector"
          variant="outline"
          className={`md:px-2 md:h-[34px] ${className}`}
        >
          {selectedModel?.name || 'Select Model'}
          <Icon icon="lucide:chevron-down" className="ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[300px]">
        {availableModels.map(model => (
          <DropdownMenuItem
            key={model.id}
            data-testid={`model-selector-item-${model.id}`}
            onSelect={() => selectModel(model)}
            className="cursor-pointer"
          >
            <div className="flex flex-col gap-1 items-start">
              <div className="flex items-center gap-2">
                <span>{model?.name}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {model?.description}
              </div>
            </div>
            {model?.id === selectedModel?.id && (
              <Icon icon="lucide:check-circle" className="ml-auto" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
