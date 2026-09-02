import type { Visibility } from '@/types/enum'
import { ModelSelector } from '@/components/chat/ModelSelector'
import { SidebarToggle } from '@/components/chat/SidebarToggle'
import { VisibilitySelector } from '@/components/chat/VisibilitySelector'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { VisibilityProvider } from '@/hooks/useVisibility'
import { useWindowSize } from '@/hooks/useWindowSize'

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
  const { open } = useSidebar()
  const { width: windowWidth } = useWindowSize()

  function handleNewChat() {
    window.location.href = '/'
  }

  return (
    <VisibilityProvider initialVisibility={selectedVisibilityType}>
      <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2 z-10">
        <SidebarToggle />

        {(!open || windowWidth < 768) && (
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
        )}

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
