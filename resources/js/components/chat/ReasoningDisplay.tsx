import { Brain, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface ReasoningDisplayProps {
  reasoning: string
}

export function ReasoningDisplay({ reasoning }: ReasoningDisplayProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!reasoning)
    return null

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full my-2">
      <CollapsibleTrigger className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted/50 w-full text-left">
        <Brain className="size-3.5 text-primary/70" />
        <span>Thinking process</span>
        {isOpen ? (
          <ChevronDown className="size-3.5 ml-auto" />
        ) : (
          <ChevronRight className="size-3.5 ml-auto" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1 p-3 rounded-md bg-muted/40 border border-border/50 text-xs font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">
        {reasoning}
      </CollapsibleContent>
    </Collapsible>
  )
}
