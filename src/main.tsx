import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SpotifyProvider } from './hooks/useSpotify'
import { handleCallback } from './utils/spotifyAuth'

// Handle OAuth callback before React renders
if (window.location.pathname === '/callback') {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const error = params.get('error')
  if (code && !error) {
    handleCallback(code)
      .catch(() => {
        // Swallow — user will see disconnected state
      })
      .finally(() => {
        // Clear the code from the URL and return to home
        window.history.replaceState({}, '', '/')
      })
  } else {
    window.history.replaceState({}, '', '/')
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SpotifyProvider>
      <App />
    </SpotifyProvider>
  </StrictMode>,
)
