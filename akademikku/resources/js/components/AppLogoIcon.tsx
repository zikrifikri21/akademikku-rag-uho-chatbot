import * as React from 'react'
import { cn } from '@/lib/utils'

export function AppLogoIcon({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src="/android-chrome-192x192.png"
      alt="Akademikku Logo"
      className={cn('size-6 rounded-md object-cover', className)}
      {...props}
    />
  )
}
