import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './styles/globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutos
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1C2333',
            color: '#F1F5F9',
            border: '1px solid #2A3347',
            borderRadius: '8px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#4ADE80', secondary: '#1C2333' } },
          error: { iconTheme: { primary: '#F87171', secondary: '#1C2333' } },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>,
)
