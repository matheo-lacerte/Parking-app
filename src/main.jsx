import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import router from './router.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { LoadingProvider } from './context/LoadingContext.jsx'
import GlobalLoader from './components/loading/GlobalLoader.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LoadingProvider>
      <AuthProvider>
        <RouterProvider router={router} />
        <GlobalLoader />
      </AuthProvider>
    </LoadingProvider>
  </StrictMode>,
)
