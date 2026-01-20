import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    // Disabled StrictMode during development due to Socket.io double-mount issues
    // Re-enable in production by uncommenting the wrapper
    // <React.StrictMode>
    <App />
    // </React.StrictMode>,
)
