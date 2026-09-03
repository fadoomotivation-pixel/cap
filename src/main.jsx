import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const container = document.getElementById('root');
const tree = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Public routes ship as prerendered HTML (see scripts/prerender.mjs), so those
// pages hydrate rather than re-render from scratch. Private routes have no
// prerendered markup and mount normally.
if (container.dataset.prerendered === 'true') {
  hydrateRoot(container, tree);
} else {
  createRoot(container).render(tree);
}
