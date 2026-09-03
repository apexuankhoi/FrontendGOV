import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import './index.css'
import './citizen.css'
import App from './App.jsx'
import { initGlobalDialog } from './utils/dialog.js'

initGlobalDialog();

const initialPath = sessionStorage.getItem('currentPath') || '/';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>
  </StrictMode>,
)
