import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initPerformanceMonitoring } from './lib/performance'
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker (local file for offline support)
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

// Initialize performance monitoring
initPerformanceMonitoring();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker after React is mounted
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        updateViaCache: 'none' // Never use HTTP cache for service worker updates
      });

      console.log('Service Worker registered:', registration.scope);

      // Check for updates immediately
      registration.update();

      // Check for updates every 60 seconds
      setInterval(() => {
        registration.update();
      }, 60000);

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New service worker available. Reloading...');
              // Automatically reload to get the latest version
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          });
        }
      });
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  });
}
