import "./styles/merlin-design-system.css";
import "./styles/mobile-responsive.css";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
// Test calculations temporarily disabled for production build
// import './utils/testCalculations'

// Initialize AI Data Collection Service
// TEMPORARILY DISABLED - Testing blank page issue
// import { initializeAIDataCollection } from './services/aiDataCollectionService'

// Start background data collection on app load
// console.log('🤖 Initializing AI Data Collection Service...');
// initializeAIDataCollection();

const CHUNK_RELOAD_KEY = "merlin:chunk-reload-once";

function isDynamicChunkLoadError(reason: unknown): boolean {
  if (!(reason instanceof Error)) return false;

  return (
    reason.message.includes("Failed to fetch dynamically imported module") ||
    reason.message.includes("Importing a module script failed")
  );
}

function reloadForStaleChunk() {
  if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1") return;

  sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
  window.location.reload();
}

window.addEventListener("pageshow", () => {
  sessionStorage.removeItem(CHUNK_RELOAD_KEY);
});

window.addEventListener("error", (event) => {
  if (isDynamicChunkLoadError(event.error)) {
    console.warn("Recovering from stale chunk load failure via hard reload.");
    reloadForStaleChunk();
  }
});

window.addEventListener("unhandledrejection", (event) => {
  if (isDynamicChunkLoadError(event.reason)) {
    console.warn("Recovering from stale dynamic import failure via hard reload.");
    reloadForStaleChunk();
  }
});

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found!");
  }

  const root = createRoot(rootElement);
  root.render(<App />);
} catch (error) {
  console.error("❌ FATAL ERROR during initialization:", error);
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: monospace;">
      <h1 style="color: red;">❌ Application Failed to Load</h1>
      <p><strong>Error:</strong> ${error instanceof Error ? error.message : String(error)}</p>
      <p>Check the browser console for more details.</p>
    </div>
  `;
}
