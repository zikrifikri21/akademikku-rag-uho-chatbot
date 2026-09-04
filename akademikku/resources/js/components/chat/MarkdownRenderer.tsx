import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
  isUser?: boolean
  className?: string
}

export function MarkdownRenderer({ content, isUser = false, className = '' }: MarkdownRendererProps) {
  return (
    <div
      className={`prose prose-sm max-w-none break-words ${
        isUser
          ? 'text-primary-foreground [&_*]:!text-primary-foreground [&_code]:!bg-primary-foreground/20 [&_code]:!text-primary-foreground'
          : 'dark:prose-invert'
      } ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
