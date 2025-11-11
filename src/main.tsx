import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
// Test calculations temporarily disabled for production build
// import './utils/testCalculations'

createRoot(document.getElementById('root')!).render(
  <App />
)
