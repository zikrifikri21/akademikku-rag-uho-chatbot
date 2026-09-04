interface HeadingSmallProps {
  title: string
  description?: string
}

export function HeadingSmall({ title, description }: HeadingSmallProps) {
  return (
    <div className="space-y-0.5">
      <h3 className="text-base font-semibold">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
