import { createInertiaApp } from '@inertiajs/react'
import createServer from '@inertiajs/react/server'
import ReactDOMServer from 'react-dom/server'
import { route as ziggyRoute } from 'ziggy-js'

const appName = import.meta.env.VITE_APP_NAME || 'Laravel'

// Preload all pages eagerly at SSR server startup to avoid per-request async dynamic import race condition
const pages = import.meta.glob<{ default: React.ComponentType }>(
  './pages/**/*.tsx',
  { eager: true },
)

createServer(page =>
  createInertiaApp({
    page,
    render: ReactDOMServer.renderToString,
    title: title => `${title} - ${appName}`,
    resolve: name => {
      const component = pages[`./pages/${name}.tsx`]
      if (!component) throw new Error(`Page not found: ${name}`)
      return component
    },
    // DO NOT add await/async calls inside setup()! Doing so reopens the Ziggy globalThis race window.
    // See implementation_plan.md#Phase-3b for details.
    setup({ App, props }) {
      const ziggyConfig = {
        ...page.props.ziggy,
        location: new URL(page.props.ziggy.location),
      }

      // ponytail: per-request globalThis mutation — race risk under concurrent SSR load
      const route = (name: string, params?: any, absolute?: boolean) =>
        ziggyRoute(name, params, absolute, ziggyConfig)

      ;(globalThis as any).route = route

      return <App {...props} />
    },
  }),
)
