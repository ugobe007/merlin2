import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
// Test calculations temporarily disabled for production build
// import './utils/testCalculations'

// Initialize AI Data Collection Service
// TEMPORARILY DISABLED - Testing blank page issue
// import { initializeAIDataCollection } from './services/aiDataCollectionService'

// Start background data collection on app load
// console.log('🤖 Initializing AI Data Collection Service...');
// initializeAIDataCollection();

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found!');
  }
  
  const root = createRoot(rootElement);
  root.render(<App />);
} catch (error) {
  console.error('❌ FATAL ERROR during initialization:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: monospace;">
      <h1 style="color: red;">❌ Application Failed to Load</h1>
      <p><strong>Error:</strong> ${error instanceof Error ? error.message : String(error)}</p>
      <p>Check the browser console for more details.</p>
    </div>
  `;
}
