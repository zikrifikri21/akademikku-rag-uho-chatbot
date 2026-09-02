import { useEffect, useState } from 'react'

export type Appearance = 'light' | 'dark' | 'system'

export function updateTheme(value: Appearance) {
  if (typeof window === 'undefined') {
    return
  }

  if (value === 'system') {
    const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)')
    const systemTheme = mediaQueryList.matches ? 'dark' : 'light'

    document.documentElement.classList.toggle('dark', systemTheme === 'dark')
  }
  else {
    document.documentElement.classList.toggle('dark', value === 'dark')
  }
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') {
    return
  }

  const maxAge = days * 24 * 60 * 60
  document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`
}

function mediaQuery() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.matchMedia('(prefers-color-scheme: dark)')
}

function getStoredAppearance(): Appearance | null {
  if (typeof window === 'undefined') {
    return null
  }

  return localStorage.getItem('appearance') as Appearance | null
}

function handleSystemThemeChange() {
  const currentAppearance = getStoredAppearance()
  updateTheme(currentAppearance || 'system')
}

export function initializeTheme() {
  if (typeof window === 'undefined') {
    return
  }

  const savedAppearance = getStoredAppearance()
  updateTheme(savedAppearance || 'system')
  mediaQuery()?.addEventListener('change', handleSystemThemeChange)
}

export function useAppearance() {
  const [appearance, setAppearance] = useState<Appearance>('system')

  useEffect(() => {
    const savedAppearance = getStoredAppearance()
    if (savedAppearance) {
      setAppearance(savedAppearance)
    }
  }, [])

  function updateAppearance(value: Appearance) {
    setAppearance(value)
    localStorage.setItem('appearance', value)
    setCookie('appearance', value)
    updateTheme(value)
  }

  return {
    appearance,
    updateAppearance,
  }
}
