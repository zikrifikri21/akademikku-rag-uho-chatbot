import type { Visibility } from '@/types/enum'
import { router } from '@inertiajs/react'
import { ModelSelector } from '@/components/chat/ModelSelector'
import { VisibilitySelector } from '@/components/chat/VisibilitySelector'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { VisibilityProvider } from '@/hooks/useVisibility'

interface ChatHeaderProps {
  chatId: string
  selectedModelId: string
  selectedVisibilityType: Visibility
  isReadonly: boolean
}

export function ChatHeader({
  chatId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
}: ChatHeaderProps) {
  function handleNewChat() {
    router.visit(route('chats.index'))
  }

  return (
    <VisibilityProvider initialVisibility={selectedVisibilityType}>
      <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2 z-10">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
              onClick={handleNewChat}
            >
              <Icon icon="lucide:plus" />
              <span className="md:sr-only">New Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Chat</TooltipContent>
        </Tooltip>

        {!isReadonly && (
          <ModelSelector className="order-1 md:order-2" />
        )}

        {!isReadonly && (
          <VisibilitySelector className="order-1 md:order-3" />
        )}
      </header>
    </VisibilityProvider>
  )
}
