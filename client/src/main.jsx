import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

import { LockedVaultContext, LockedVaultProvider } from './context/LockedVaultContext'
ReactDOM.createRoot(document.getElementById('root')).render(
  <LockedVaultProvider>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </LockedVaultProvider>

)
