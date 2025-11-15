import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
// Test calculations temporarily disabled for production build
// import './utils/testCalculations'

// Initialize AI Data Collection Service
import { initializeAIDataCollection } from './services/aiDataCollectionService'

// Start background data collection on app load
console.log('🤖 Initializing AI Data Collection Service...');
initializeAIDataCollection();

createRoot(document.getElementById('root')!).render(
  <App />
)
