import type { ReactNode } from 'react'
import { Sidebar } from '../components/Sidebar'

type Props = {
  children: ReactNode
  noSideBar?: boolean
}

export function MainLayout({ children, noSideBar = false }: Props) {
  if (noSideBar) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>
        <main className="max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: 'var(--color-background)' }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 sm:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}