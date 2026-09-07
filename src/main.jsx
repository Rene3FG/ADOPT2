import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import '@fontsource/inter'

// Despierta el backend en Render (free tier se duerme a los 15 min sin
// tráfico y tarda ~30-60s en arrancar). Se dispara al cargar la página
// para que ya esté vivo cuando el usuario termine de teclear su login.
fetch(`${import.meta.env.VITE_API_URL || 'https://ado-project.onrender.com'}/areas`)
  .catch(() => {})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
