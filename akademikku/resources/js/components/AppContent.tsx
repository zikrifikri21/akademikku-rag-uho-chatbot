import * as React from 'react'
import { cn } from '@/lib/utils'

interface AppContentProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'sidebar' | 'header'
}

export function AppContent({
  variant = 'sidebar',
  className,
  children,
  ...props
}: AppContentProps) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col transition-all duration-300 ease-in-out',
        variant === 'sidebar' && 'peer-data-[state=collapsed]:w-full',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
