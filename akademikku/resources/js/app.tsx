import { createInertiaApp, router } from '@inertiajs/react'
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

// Keep DOM CSRF token meta tag in sync after login/navigation
router.on('navigate', (event) => {
  const token = (event.detail.page.props as any)?.csrf_token as string | undefined
  if (token && typeof document !== 'undefined') {
    const meta = document.querySelector('meta[name="csrf-token"]')
    if (meta) {
      meta.setAttribute('content', token)
    }
  }
})

// Auto-redirect to login page when session expires (419 Page Expired or 401 Unauthenticated)
router.on('invalid', (event) => {
  const status = event.detail.response?.status
  if (status === 419 || status === 401) {
    event.preventDefault()
    window.location.href = route('login')
  }
})

router.on('exception', (event) => {
  const status = (event.detail as any)?.response?.status
  if (status === 419 || status === 401) {
    window.location.href = route('login')
  }
})

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
