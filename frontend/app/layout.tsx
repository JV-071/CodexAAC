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
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/images/background.jpg)',
          }}
        ></div>
        <div 
          className="fixed inset-0 z-0"
          style={{
            background: 'linear-gradient(180deg, #2a3a4a 0%, #1a2a3a 50%, #2a3a4a 100%)',
            opacity: 0.6
          }}
        ></div>
        <div className="fixed inset-0 z-0 bg-[#1a1a1a]/60"></div>
        <div className="relative z-10">
          <TopBar />
          {children}
        </div>
      </body>
    </html>
  )
}

