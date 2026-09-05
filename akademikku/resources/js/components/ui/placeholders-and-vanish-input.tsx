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

  const draw = useCallback(() => {
    if (!inputRef.current)
      return
    const canvas = canvasRef.current
    if (!canvas)
      return
    const ctx = canvas.getContext('2d')
    if (!ctx)
      return

    canvas.width = 800
    canvas.height = 800
    ctx.clearRect(0, 0, 800, 800)
    const computed = getComputedStyle(inputRef.current)
    ctx.font = `${computed.fontSize} ${computed.fontFamily}`
    ctx.fillStyle = computed.color
    ctx.fillText(value, 16, 40)

    const imageData = ctx.getImageData(0, 0, 800, 800)
    const pixelData = imageData.data
    const newData: any[] = []

    for (let t = 0; t < 800; t++) {
      const i = 4 * t * 800
      for (let n = 0; n < 800; n++) {
        const e = i + 4 * n
        if (pixelData[e + 3] !== 0) {
          newData.push({
            x: n,
            y: t,
            color: [pixelData[e], pixelData[e + 1], pixelData[e + 2], pixelData[e + 3]],
          })
        }
      }
    }

    const particles = newData.map(pixel => ({
      x: pixel.x,
      y: pixel.y,
      r: Math.random() * 2 + 1,
      color: `rgba(${pixel.color[0]}, ${pixel.color[1]}, ${pixel.color[2]}, ${pixel.color[3] / 255})`,
      vx: Math.random() * 4 - 2,
      vy: Math.random() * 4 - 2,
    }))

    const render = () => {
      ctx.clearRect(0, 0, 800, 800)
      let count = 0
      particles.forEach((p) => {
        if (p.r > 0.1) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx.fillStyle = p.color
          ctx.fill()
          p.x += p.vx
          p.y += p.vy
          p.r -= 0.05
          count++
        }
      })
      if (count > 0) {
        requestAnimationFrame(render)
      }
      else {
        setAnimating(false)
      }
    }
    render()
  }, [value])

  const vanishAndSubmit = () => {
    setAnimating(true)
    draw()
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isLoading && onStop) {
      onStop()
      return
    }
    if (!value.trim() || disabled)
      return
    vanishAndSubmit()
    onSubmit(e)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !disabled && !isLoading) {
        vanishAndSubmit()
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
          'absolute pointer-events-none text-base transform scale-50 top-0 left-0 origin-top-left filter invert dark:invert-0 pr-20',
          !animating ? 'opacity-0' : 'opacity-100',
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
