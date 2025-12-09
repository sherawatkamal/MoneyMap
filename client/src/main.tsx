/* main.tsx

Kamal Sherawat Virginia Tech August 22, 2025

React application entry point that initializes and renders the root App component.

*/

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
