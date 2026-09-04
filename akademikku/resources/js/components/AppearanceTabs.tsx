import type { Appearance } from '@/hooks/useAppearance'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useAppearance } from '@/hooks/useAppearance'

export function AppearanceTabs() {
  const { appearance, updateAppearance } = useAppearance()

  const tabs: { value: Appearance; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ]

  return (
    <div className="inline-flex gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
      {tabs.map(({ value, icon: IconComp, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => updateAppearance(value)}
          className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            appearance === value
              ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-100'
              : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
          }`}
        >
          <IconComp className="h-4 w-4" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}
