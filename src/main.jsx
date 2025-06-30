// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext' // ← AGREGAR
import './index.css'
import './styles/theme-variables.css' // ← AGREGAR

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider> {/* ← ENVOLVER LA APP */}
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)