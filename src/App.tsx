import { AppRoutes } from './routes'
import { Toaster } from 'react-hot-toast'

function App() {

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--color-background-elevated)',
            color: 'var(--color-text-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 16px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--color-border)',
            fontSize: 'var(--text-sm)',
            maxWidth: '90vw',
          },
          success: {
            style: {
              borderLeft: '4px solid var(--color-success)',
            },
          },
          error: {
            style: {
              borderLeft: '4px solid var(--color-error)',
            },
          },
        }}
      />
      <AppRoutes />
    </>
  )
}

export default App