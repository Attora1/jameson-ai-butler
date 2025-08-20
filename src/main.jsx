import React from 'react';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/global.css'
import App from './App.jsx'
import { SpoonProvider } from './context/SpoonContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SpoonProvider>
      <App />
    </SpoonProvider>
  </StrictMode>,
)
