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
  isGuest?: boolean
}

export function ChatHeader({
  chatId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
  isGuest = false,
}: ChatHeaderProps) {
  function handleNewChat() {
    router.visit(route('chats.index'))
  }

  function handleVisibilityChange(newVisibility: Visibility) {
    // Only persist if this is an existing chat (has a chatId)
    if (!chatId) return
    router.patch(
      route('chats.update', { chat: chatId }),
      { visibility: newVisibility },
      { preserveScroll: true, preserveState: true },
    )
  }

  return (
    <VisibilityProvider
      initialVisibility={selectedVisibilityType}
      onVisibilityChange={handleVisibilityChange}
    >
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

        {!isReadonly && !isGuest && (
          <VisibilitySelector className="order-1 md:order-3" />
        )}
      </header>
    </VisibilityProvider>
  )
}
