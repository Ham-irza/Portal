import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import './index.css'
import App from './App.tsx' // <-- We un-commented this!

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App /> {/* <-- We removed the iframe and put App back! */}
    </ErrorBoundary>
  </StrictMode>,
)