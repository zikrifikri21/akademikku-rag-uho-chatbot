import { Link } from '@inertiajs/react'
import * as React from 'react'

interface TextLinkProps extends React.ComponentProps<typeof Link> {
  children: React.ReactNode
}

export function TextLink({ className = '', children, ...props }: TextLinkProps) {
  return (
    <Link
      className={`text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current dark:decoration-neutral-500 ${className}`}
      {...props}
    >
      {children}
    </Link>
  )
}
