import { Brain, ChevronDown, ChevronRight, FileText, Globe } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface ReasoningDisplayProps {
  reasoning: unknown
  isLoading?: boolean
}

interface SourceItem {
  title?: string
  source?: string
  asal?: string
}

function parseReasoning(reasoning: unknown): { text: string; sources: SourceItem[] } {
  if (!reasoning)
    return { text: '', sources: [] }

  let raw = typeof reasoning === 'string' ? reasoning : JSON.stringify(reasoning)
  raw = raw.replace(/\[object Object\]/g, '').trim()

  if (!raw)
    return { text: '', sources: [] }

  const sources: SourceItem[] = []
  const textLines: string[] = []

  const lines = raw.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed)
      continue

    // Skip status messages
    if (trimmed.includes('Sedang mencari dokumen') || trimmed.includes('Mencari dokumen')) {
      continue
    }

    // Check if line contains JSON object(s) with title/source
    const jsonMatches = trimmed.match(/\{[^{}]*"title"[^{}]*\}/g)
    if (jsonMatches && jsonMatches.length > 0) {
      let matchedCount = 0
      for (const jsonStr of jsonMatches) {
        try {
          const item = JSON.parse(jsonStr) as SourceItem
          if (item.title || item.source) {
            sources.push(item)
            matchedCount++
          }
        }
        catch {
          // Ignore parse errors
        }
      }
      if (matchedCount > 0 && trimmed.replace(/\{[^{}]*"title"[^{}]*\}/g, '').trim() === '') {
        continue
      }
    }

    textLines.push(trimmed)
  }

  return {
    text: textLines.join('\n').trim(),
    sources,
  }
}

export function ReasoningDisplay({ reasoning, isLoading = false }: ReasoningDisplayProps) {
  const [isOpen, setIsOpen] = useState(true)
  const { text, sources } = parseReasoning(reasoning)

  // Auto-close when streaming ends
  useEffect(() => {
    if (!isLoading) {
      setIsOpen(false)
    }
    else {
      setIsOpen(true)
    }
  }, [isLoading])

  // If completed and no actual reasoning text & no sources, do not display anything
  if (!isLoading && !text && sources.length === 0) {
    return null
  }

  // Show loading indicator while request is in progress and no sources/text are present yet
  if (isLoading && !text && sources.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground p-2 rounded-lg bg-muted/40 border border-border/50 w-full my-2">
        <Brain className="size-4 text-primary animate-spin" />
        <span className="font-semibold text-foreground/90">Sedang mencari dokumen resmi UHO & menganalisis...</span>
        <span className="ml-auto flex gap-1">
          <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
          <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
          <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
        </span>
      </div>
    )
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full my-2">
      <CollapsibleTrigger className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg bg-muted/40 hover:bg-muted/70 border border-border/50 w-full text-left">
        <Brain className={`size-4 text-primary ${isLoading ? 'animate-spin' : ''}`} />
        <span className="font-semibold text-foreground/90">
          {isLoading
            ? 'Sedang berpikir & menganalisis...'
            : sources.length > 0
              ? 'Proses berpikir & referensi RAG'
              : 'Proses berpikir AI'}
        </span>
        {isOpen ? (
          <ChevronDown className="size-4 ml-auto text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 ml-auto text-muted-foreground" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1.5 p-3.5 rounded-lg bg-muted/30 border border-border/50 text-xs text-muted-foreground leading-relaxed space-y-2.5">
        {sources.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-muted-foreground tracking-wide font-sans">
              Sumber referensi UHO yang ditemukan:
            </div>
            <div className="space-y-1 font-sans">
              {sources.map((src, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-md bg-background/80 border border-border/40 text-foreground/90 text-xs"
                >
                  {src.asal === 'web_search' ? (
                    <Globe className="size-3.5 text-blue-500 shrink-0" />
                  ) : (
                    <FileText className="size-3.5 text-amber-500 shrink-0" />
                  )}
                  <span className="font-medium truncate flex-1">{src.title || src.source}</span>
                  <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted font-mono shrink-0">
                    {src.asal === 'web_search' ? 'Pencarian Web' : 'Vector Store UHO'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {text && (
          <div className="font-mono whitespace-pre-wrap leading-relaxed pt-1 text-foreground/80 bg-background/60 p-3 rounded-md border border-border/30 shadow-inner max-h-96 overflow-y-auto">
            {text}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
