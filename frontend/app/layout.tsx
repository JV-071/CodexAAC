import type { Metadata } from 'next'
import './globals.css'
import TopBar from './components/layout/TopBar'

export const metadata: Metadata = {
  title: 'CodexAAC',
  description: 'Aplicação CodexAAC',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-[#1a1a1a]">
        {/* Background with illustration */}
        <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat bg-background-image"></div>
        <div className="fixed inset-0 z-0 bg-gradient-overlay opacity-60"></div>
        <div className="fixed inset-0 z-0 bg-[#1a1a1a]/60"></div>
        <div className="relative z-10">
          <TopBar />
          {children}
        </div>
      </body>
    </html>
  )
}

