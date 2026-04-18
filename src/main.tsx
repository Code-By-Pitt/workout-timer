import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './hooks/useAuth'
import { SpotifyProvider } from './hooks/useSpotify'
import { handleCallback } from './utils/spotifyAuth'

// Handle Spotify OAuth callback before React renders
if (window.location.pathname === '/callback') {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const error = params.get('error')
  if (code && !error) {
    handleCallback(code)
      .catch(() => {})
      .finally(() => {
        window.history.replaceState({}, '', '/')
      })
  } else {
    window.history.replaceState({}, '', '/')
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SpotifyProvider>
        <App />
      </SpotifyProvider>
    </AuthProvider>
  </StrictMode>,
)
