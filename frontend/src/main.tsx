import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from './components/ErrorBoundary'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
        <Toaster 
          position="top-right" 
          toastOptions={{ 
            duration: 4000, 
            style: { 
              borderRadius: '12px', 
              background: '#fff', 
              color: '#1e293b', 
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)', 
              fontSize: '14px', 
              fontFamily: 'Inter, sans-serif' 
            } 
          }} 
        />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)

