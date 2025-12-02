'use client'

import Link from 'next/link'
import { useServerName } from '../hooks/useServerName'

const CLIENT_VERSION = process.env.NEXT_PUBLIC_CLIENT_VERSION ?? '1.0.0'
const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_DOWNLOAD_URL ?? '#'

export default function DownloadPage() {
  const serverName = useServerName()
  return (
    <div>
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              <span className="text-[#ffd700]">Download</span>
              <span className="text-[#3b82f6]"> Client</span>
            </h1>
            <p className="text-[#d0d0d0] text-sm">Get the official {serverName} client to start your adventure</p>
          </div>

          {/* Main Download Card */}
          <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 sm:p-8 shadow-2xl ring-2 ring-[#ffd700]/10 mb-6">
            {/* Logo Section */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center mb-4">
                <div className="bg-gradient-to-br from-[#ffd700] to-[#ffed4e] p-6 rounded-2xl shadow-xl">
                  <span className="text-6xl">🐉</span>
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                <span className="text-[#ffd700]">Official {serverName}</span>
                <span className="text-[#3b82f6]"> Client</span>
              </h2>
              <p className="text-[#888] text-sm">Version {CLIENT_VERSION}</p>
            </div>

            {/* Download Button */}
            <div className="text-center mb-8">
              <a
                href={CLIENT_URL}
                className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-lg"
              >
                <span className="text-2xl">⬇️</span>
                <span>Download {serverName} Client</span>
              </a>
              <div className="mt-4">
                <Link
                  href="/download/requirements"
                  className="text-[#3b82f6] hover:text-[#60a5fa] text-sm underline"
                >
                  [System Requirements]
                </Link>
              </div>
            </div>

            {/* Description */}
            <div className="bg-[#1f1f1f]/80 rounded-lg border border-[#404040]/50 p-6 mb-6">
              <h3 className="text-[#ffd700] text-lg font-bold mb-3">About the Client</h3>
              <p className="text-[#d0d0d0] leading-relaxed mb-3">
                An extremely optimized and exclusive {serverName} client. It features exclusive functions designed
                for all players to enhance their gaming experience. The client is optimized in all aspects,
                from performance to user experience.
              </p>
              <p className="text-[#d0d0d0] leading-relaxed">
                This client always receives the best updates, and all updates are automatic. You'll never
                have to worry about manually updating - we take care of everything so you can focus on your adventure.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-[#1f1f1f]/80 rounded-lg border border-[#404040]/50 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">⚡</span>
                  <h4 className="text-[#ffd700] font-bold">High Performance</h4>
                </div>
                <p className="text-[#d0d0d0] text-sm">Optimized for smooth gameplay even on lower-end systems</p>
              </div>
              <div className="bg-[#1f1f1f]/80 rounded-lg border border-[#404040]/50 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🔄</span>
                  <h4 className="text-[#ffd700] font-bold">Auto Updates</h4>
                </div>
                <p className="text-[#d0d0d0] text-sm">Automatic updates ensure you always have the latest features</p>
              </div>
              <div className="bg-[#1f1f1f]/80 rounded-lg border border-[#404040]/50 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🛡️</span>
                  <h4 className="text-[#ffd700] font-bold">Secure & Safe</h4>
                </div>
                <p className="text-[#d0d0d0] text-sm">Built with security in mind to protect your account</p>
              </div>
              <div className="bg-[#1f1f1f]/80 rounded-lg border border-[#404040]/50 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🎮</span>
                  <h4 className="text-[#ffd700] font-bold">Enhanced Features</h4>
                </div>
                <p className="text-[#d0d0d0] text-sm">Exclusive features designed specifically for {serverName}</p>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-[#1a1a1a]/90 rounded-lg border-2 border-[#404040]/60 p-5">
              <h3 className="text-[#ffd700] font-bold mb-3">Disclaimer</h3>
              <p className="text-[#d0d0d0] text-sm leading-relaxed">
                The software and any related documentation is provided "as is" without warranty of any kind.
                The entire risk arising out of use of the software remains with you. In no event shall {serverName}
                be liable for any damages to your computer or loss of data.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
