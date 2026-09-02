import { useEffect, useState } from 'react'

export function useWindowSize() {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 0,
  )

  useEffect(() => {
    if (typeof window === 'undefined')
      return

    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return { width }
}
