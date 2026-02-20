import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import './styles/ocean.css'
import './styles/island.css'
import './styles/journal.css'
import './styles/tsunami-link.css'
import './styles/landscape-nav.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
