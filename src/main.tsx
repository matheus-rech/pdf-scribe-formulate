import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker (local file for offline support)
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

// Render React app first
createRoot(document.getElementById("root")!).render(<App />);

// Register service worker after React is mounted
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // First, unregister any existing service workers to ensure clean slate
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      
      // Now register the new service worker
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered:', registration.scope);
      
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New service worker available.');
              // Optionally reload the page to activate new service worker
              if (confirm('New version available. Reload to update?')) {
                window.location.reload();
              }
            }
          });
        }
      });
    } catch (error) {
      console.error('Service Worker error:', error);
    }
  });
}
