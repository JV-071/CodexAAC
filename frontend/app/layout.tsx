import type { Metadata } from 'next'
import './globals.css'
import TopBar from './components/layout/TopBar'
import { AuthProvider } from './contexts/AuthContext'

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
      <body className="min-h-screen bg-[#1a1a1a] pt-[85px]">
        {/* Background with illustration */}
        <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat bg-background-image"></div>
        <div className="fixed inset-0 z-0 bg-gradient-overlay opacity-60"></div>
        <div className="fixed inset-0 z-0 bg-[#1a1a1a]/60"></div>
        <div className="relative z-10">
          <AuthProvider>
            <TopBar />
            {children}
          </AuthProvider>
        </div>
      </body>
    </html>
  )
}
