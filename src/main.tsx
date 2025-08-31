import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './lib/i18n-setup.ts'
import { registerServiceWorker, addResourceHints, trackWebVitals } from './lib/performance'

// Performance optimizations
addResourceHints();
registerServiceWorker();

// Track web vitals
if (import.meta.env.PROD) {
  import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
    onCLS(trackWebVitals);
    onFCP(trackWebVitals);
    onLCP(trackWebVitals);
    onTTFB(trackWebVitals);
    onINP(trackWebVitals);
  });
}

createRoot(document.getElementById("root")!).render(<App />);
