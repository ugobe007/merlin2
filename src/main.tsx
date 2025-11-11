import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './utils/testCalculations' // Make test function available in console

createRoot(document.getElementById('root')!).render(
  <App />
)
