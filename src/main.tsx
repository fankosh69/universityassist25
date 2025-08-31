import { createRoot } from 'react-dom/client'
import 'mapbox-gl/dist/mapbox-gl.css'
import App from './App.tsx'
import './index.css'
import './lib/i18n-setup.ts'

createRoot(document.getElementById("root")!).render(<App />);
