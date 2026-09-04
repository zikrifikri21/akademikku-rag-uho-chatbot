import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function SidebarToggle() {
  const { toggleSidebar } = useSidebar()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          className="md:px-2 md:h-fit"
          onClick={toggleSidebar}
        >
          <Icon icon="lucide:sidebar font-semibold" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Toggle Sidebar</TooltipContent>
    </Tooltip>
  )
}
