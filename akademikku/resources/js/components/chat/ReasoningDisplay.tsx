import { Brain, ChevronDown, ChevronRight, FileText, Globe } from 'lucide-react'
import { useState } from 'react'
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
  const [isOpen, setIsOpen] = useState(false)
  const { text, sources } = parseReasoning(reasoning)

  if (!text && sources.length === 0)
    return null

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full my-2">
      <CollapsibleTrigger className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted/50 w-full text-left">
        <Brain className={`size-3.5 text-primary/70 ${isLoading ? 'animate-pulse' : ''}`} />
        <span>{sources.length > 0 ? 'Proses berpikir & referensi' : 'Proses berpikir'}</span>
        {isOpen ? (
          <ChevronDown className="size-3.5 ml-auto" />
        ) : (
          <ChevronRight className="size-3.5 ml-auto" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1 p-3 rounded-md bg-muted/40 border border-border/50 text-xs text-muted-foreground leading-relaxed space-y-2">
        {sources.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-muted-foreground tracking-wide font-sans">
              Sumber referensi yang ditemukan:
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
                    {src.asal === 'web_search' ? 'Pencarian Web' : 'Vector Store'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {text && (
          <div className="font-mono whitespace-pre-wrap leading-relaxed pt-1">
            {text}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
