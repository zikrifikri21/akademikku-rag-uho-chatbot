import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'

interface SuggestedActionsProps {
  onAppend: (message: string) => void
}

export function SuggestedActions({ onAppend }: SuggestedActionsProps) {
  const actions = [
    {
      title: 'What are the best practices',
      label: 'for writing clean Laravel code?',
      action: 'What are the best practices for writing clean Laravel code?',
      icon: 'lucide:code-2',
    },
    {
      title: 'Help me draft an email',
      label: 'to request time off next week',
      action: 'Help me draft a professional email to request time off next week',
      icon: 'lucide:mail',
    },
    {
      title: 'Explain quantum computing',
      label: 'in simple terms with analogies',
      action: 'Explain quantum computing in simple terms with analogies',
      icon: 'lucide:atom',
    },
    {
      title: 'Design a database schema',
      label: 'for an e-commerce platform',
      action: 'Design a normalized database schema for an e-commerce platform',
      icon: 'lucide:database',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl mx-auto w-full p-4">
      {actions.map(action => (
        <Button
          key={action.title}
          variant="outline"
          className="h-auto p-4 flex flex-col items-start justify-start text-left space-y-1 hover:border-primary/50 transition-all group"
          onClick={() => onAppend(action.action)}
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground group-hover:text-primary">
            <Icon icon={action.icon} className="size-4" />
            <span>{action.title}</span>
          </div>
          <span className="text-xs text-muted-foreground">{action.label}</span>
        </Button>
      ))}
    </div>
  )
}
