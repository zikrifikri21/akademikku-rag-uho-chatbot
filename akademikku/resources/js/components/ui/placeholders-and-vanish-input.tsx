'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export interface PlaceholdersAndVanishInputProps {
  placeholders: string[]
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  disabled?: boolean
  isLoading?: boolean
  onStop?: () => void
}

export function PlaceholdersAndVanishInput({
  placeholders,
  value,
  onChange,
  onSubmit,
  disabled = false,
  isLoading = false,
  onStop,
}: PlaceholdersAndVanishInputProps) {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startAnimation = () => {
    intervalRef.current = setInterval(() => {
      setCurrentPlaceholder(prev => (prev + 1) % placeholders.length)
    }, 3500)
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState !== 'visible' && intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    else if (document.visibilityState === 'visible') {
      startAnimation()
    }
  }

  useEffect(() => {
    startAnimation()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [placeholders])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [animating, setAnimating] = useState(false)
  const particlesRef = useRef<any[]>([])

  const drawAndAnimate = useCallback((textToDraw: string) => {
    if (!inputRef.current || !canvasRef.current || !textToDraw.trim())
      return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx)
      return

    const rect = inputRef.current.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height
    ctx.clearRect(0, 0, rect.width, rect.height)

    const computed = getComputedStyle(inputRef.current)
    ctx.font = `${computed.fontSize} ${computed.fontFamily}`
    ctx.fillStyle = computed.color
    ctx.textBaseline = 'middle'
    ctx.fillText(textToDraw, 8, rect.height / 2)

    const imageData = ctx.getImageData(0, 0, rect.width, rect.height)
    const pixelData = imageData.data
    const newData: any[] = []

    for (let y = 0; y < rect.height; y += 2) {
      const rowOffset = 4 * y * rect.width
      for (let x = 0; x < rect.width; x += 2) {
        const offset = rowOffset + 4 * x
        const alpha = pixelData[offset + 3]
        if (alpha > 20) {
          newData.push({
            x,
            y,
            r: Math.random() * 1.8 + 0.8,
            color: `rgba(${pixelData[offset]}, ${pixelData[offset + 1]}, ${pixelData[offset + 2]}, ${alpha / 255})`,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5 - 1,
          })
        }
      }
    }

    particlesRef.current = newData
    setAnimating(true)

    const render = () => {
      ctx.clearRect(0, 0, rect.width, rect.height)
      let activeCount = 0

      particlesRef.current.forEach((p) => {
        if (p.r > 0.1) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx.fillStyle = p.color
          ctx.fill()

          p.x += p.vx
          p.y += p.vy
          p.r -= 0.04
          activeCount++
        }
      })

      if (activeCount > 0) {
        requestAnimationFrame(render)
      }
      else {
        setAnimating(false)
        ctx.clearRect(0, 0, rect.width, rect.height)
      }
    }

    render()
  }, [])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isLoading && onStop) {
      onStop()
      return
    }
    if (!value.trim() || disabled)
      return

    const textToAnimate = value
    drawAndAnimate(textToAnimate)
    onSubmit(e)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !disabled && !isLoading) {
        const textToAnimate = value
        drawAndAnimate(textToAnimate)
        onSubmit(e as any)
      }
    }
  }

  return (
    <form
      className={cn(
        'w-full relative max-w-3xl mx-auto bg-background border border-border/80 dark:border-zinc-800 h-14 rounded-full overflow-hidden shadow-[0px_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0px_2px_12px_rgba(0,0,0,0.4)] transition duration-300 flex items-center px-4 group focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary',
        value && 'bg-muted/30',
      )}
      onSubmit={handleSubmit}
    >
      <canvas
        ref={canvasRef}
        className={cn(
          'absolute inset-0 pointer-events-none z-30 w-full h-full pl-2 pr-12',
          !animating && 'opacity-0',
        )}
      />

      <input
        ref={inputRef}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        value={value}
        type="text"
        disabled={disabled}
        className={cn(
          'w-full relative text-sm sm:text-base z-20 border-none bg-transparent text-foreground h-full focus:outline-none focus:ring-0 pl-2 pr-12 font-medium placeholder-transparent',
          animating && 'text-transparent',
        )}
      />

      <button
        disabled={(!value.trim() && !isLoading) || disabled}
        type="submit"
        className="absolute right-2.5 z-30 flex items-center justify-center size-9 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 shadow-sm disabled:opacity-40 disabled:hover:bg-primary cursor-pointer disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="size-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
        ) : (
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4 text-primary-foreground"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </motion.svg>
        )}
      </button>

      <div className="absolute inset-0 flex items-center rounded-full pointer-events-none pl-6 pr-14 z-10">
        <AnimatePresence mode="wait">
          {!value && (
            <motion.p
              initial={{
                y: 8,
                opacity: 0,
              }}
              key={`placeholder-${currentPlaceholder}`}
              animate={{
                y: 0,
                opacity: 1,
              }}
              exit={{
                y: -8,
                opacity: 0,
              }}
              transition={{
                duration: 0.3,
                ease: 'linear',
              }}
              className="text-xs sm:text-sm font-medium text-muted-foreground/70 dark:text-zinc-500 truncate w-full text-left font-sans"
            >
              {placeholders[currentPlaceholder]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  )
}
