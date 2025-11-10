import { type ReactNode } from 'react'
import Header from './Header'
import Footer from './Footer'

type Props = { children: ReactNode }

export default function AppShell({ children }: Props) {
  return (
    <div className="min-h-dvh flex flex-col bg-white text-gray-900">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  )
}
