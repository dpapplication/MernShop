import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ToastProvider } from '@radix-ui/react-toast'
import { Toaster } from './components/ui/toaster.tsx'
createRoot(document.getElementById("root")!).render(

   
      <ToastProvider>
            <Toaster />
      <App />
      </ToastProvider>
  
)

