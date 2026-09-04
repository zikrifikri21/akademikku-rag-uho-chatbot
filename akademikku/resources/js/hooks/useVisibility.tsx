import React, { createContext, useContext, useEffect, useState } from 'react'
import { Visibility } from '@/types/enum'

interface VisibilityState {
  visibility: Visibility
  setVisibility: (visibility: Visibility) => void
}

const VisibilityContext = createContext<VisibilityState | null>(null)

interface VisibilityProviderProps {
  children: React.ReactNode
  initialVisibility?: Visibility
  onVisibilityChange?: (newVisibility: Visibility) => void
}

export function VisibilityProvider({
  children,
  initialVisibility = Visibility.PRIVATE,
  onVisibilityChange,
}: VisibilityProviderProps) {
  const [visibility, setVisibilityState] = useState<Visibility>(initialVisibility)

  useEffect(() => {
    setVisibilityState(initialVisibility)
  }, [initialVisibility])

  const setVisibility = (newVisibility: Visibility) => {
    setVisibilityState(newVisibility)
    if (onVisibilityChange && newVisibility !== visibility) {
      onVisibilityChange(newVisibility)
    }
  }

  const value: VisibilityState = {
    visibility,
    setVisibility,
  }

  return (
    <VisibilityContext.Provider value={value}>
      {children}
    </VisibilityContext.Provider>
  )
}

export function useVisibility(): VisibilityState {
  const context = useContext(VisibilityContext)
  if (!context) {
    throw new Error('useVisibility must be used within a VisibilityProvider')
  }
  return context
}
