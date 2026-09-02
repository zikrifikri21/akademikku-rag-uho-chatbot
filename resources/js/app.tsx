import { createInertiaApp } from '@inertiajs/react'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import { route } from 'ziggy-js'
import { ErrorBoundary } from './components/ErrorBoundary'
import { initializeTheme } from './hooks/useAppearance'
import '../css/app.css'

// Expose route() globally for client-side navigation
// Types declared in resources/js/types/ziggy.d.ts
;(globalThis as any).route = route

const appName = import.meta.env.VITE_APP_NAME || 'Laravel'

createInertiaApp({
  title: title => `${title} - ${appName}`,
  resolve: name =>
    resolvePageComponent(
      `./pages/${name}.tsx`,
      import.meta.glob('./pages/**/*.tsx'),
    ),
  setup({ el, App, props }) {
    createRoot(el).render(
      <ErrorBoundary>
        <App {...props} />
        <Toaster position="top-center" className="pointer-events-auto" />
      </ErrorBoundary>,
    )
  },
  progress: {
    color: '#4B5563',
  },
})

initializeTheme()
