import { StrictMode, Component, type ReactNode, type ErrorInfo } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tailwind.css'
import './styles/theme.css'
import './styles/globals.css'
import './styles/timeline.css'
import { initTheme } from './lib/theme'
import { applyFont } from './lib/font'
import App from './App'

initTheme()
applyFont().catch(() => { /* font missing — fall back to system stack */ })

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').catch(() => {/* ignore */})
  })
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[ErrorBoundary]', error, info) }
  render() {
    if (this.state.error) {
      return (
        <pre style={{ color: 'red', padding: '20px', whiteSpace: 'pre-wrap', fontSize: '11px' }}>
          {String(this.state.error)}{'\n'}{this.state.error.stack}
        </pre>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
