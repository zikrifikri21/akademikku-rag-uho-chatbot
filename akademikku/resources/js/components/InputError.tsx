import * as React from 'react'

interface InputErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  message?: string
}

export function InputError({ message, className = '', ...props }: InputErrorProps) {
  if (!message)
    return null

  return (
    <p className={`text-sm text-destructive ${className}`} {...props}>
      {message}
    </p>
  )
}
