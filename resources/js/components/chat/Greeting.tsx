import { Icon } from '@/components/Icon'

export function Greeting() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto my-auto space-y-4">
      <div className="rounded-full bg-primary/10 p-4 text-primary">
        <Icon icon="lucide:sparkles" className="size-8" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">What can I help you with today?</h1>
      <p className="text-muted-foreground text-sm max-w-md">
        Ask anything, generate ideas, analyze code, or write creative responses.
      </p>
    </div>
  )
}
