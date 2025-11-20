'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type RecoveryMethod = 'character' | 'username' | 'neither'

export default function RecoverAccountPage() {
  const router = useRouter()
  const [selectedMethod, setSelectedMethod] = useState<RecoveryMethod | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedMethod) {
      router.push(`/account/recover/${selectedMethod}`)
    }
  }

  return (
    <div>
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                <span className="text-[#ffd700]">Recover</span>
                <span className="text-[#3b82f6]"> Account</span>
              </h1>
              <p className="text-[#d0d0d0] text-sm">Recover your account using one of the methods below</p>
            </div>

            {/* Info Box */}
            <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 sm:p-8 shadow-2xl ring-2 ring-[#ffd700]/10 mb-6">
              <p className="text-[#d0d0d0] text-sm leading-relaxed mb-4">
                The account recovery interface can help you recover your account. Select the desired option and click "Submit". 
                If your problem is not listed here, you can find the answer by opening a ticket on our website.
              </p>
            </div>

            {/* Recovery Options Form */}
            <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 sm:p-8 shadow-2xl ring-2 ring-[#ffd700]/10">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Option 1: Character Name */}
                <label className="flex items-start gap-4 p-4 bg-[#1f1f1f]/80 rounded-lg border-2 border-[#404040]/50 hover:border-[#ffd700]/60 cursor-pointer transition-all">
                  <input
                    type="radio"
                    name="recoveryMethod"
                    value="character"
                    checked={selectedMethod === 'character'}
                    onChange={(e) => setSelectedMethod(e.target.value as RecoveryMethod)}
                    className="mt-1 w-5 h-5 bg-[#1a1a1a] border-2 border-[#404040]/60 text-[#ffd700] focus:ring-[#ffd700] focus:ring-2"
                  />
                  <div className="flex-1">
                    <h3 className="text-[#ffd700] font-bold mb-1">Recover using character name</h3>
                    <p className="text-[#d0d0d0] text-sm">I want to recover using the character name as reference.</p>
                  </div>
                </label>

                {/* Option 2: Username */}
                <label className="flex items-start gap-4 p-4 bg-[#1f1f1f]/80 rounded-lg border-2 border-[#404040]/50 hover:border-[#ffd700]/60 cursor-pointer transition-all">
                  <input
                    type="radio"
                    name="recoveryMethod"
                    value="username"
                    checked={selectedMethod === 'username'}
                    onChange={(e) => setSelectedMethod(e.target.value as RecoveryMethod)}
                    className="mt-1 w-5 h-5 bg-[#1a1a1a] border-2 border-[#404040]/60 text-[#ffd700] focus:ring-[#ffd700] focus:ring-2"
                  />
                  <div className="flex-1">
                    <h3 className="text-[#ffd700] font-bold mb-1">Recover using username</h3>
                    <p className="text-[#d0d0d0] text-sm">I want to recover using the username as reference.</p>
                  </div>
                </label>

                {/* Option 3: Neither */}
                <label className="flex items-start gap-4 p-4 bg-[#1f1f1f]/80 rounded-lg border-2 border-[#404040]/50 hover:border-[#ffd700]/60 cursor-pointer transition-all">
                  <input
                    type="radio"
                    name="recoveryMethod"
                    value="neither"
                    checked={selectedMethod === 'neither'}
                    onChange={(e) => setSelectedMethod(e.target.value as RecoveryMethod)}
                    className="mt-1 w-5 h-5 bg-[#1a1a1a] border-2 border-[#404040]/60 text-[#ffd700] focus:ring-[#ffd700] focus:ring-2"
                  />
                  <div className="flex-1">
                    <h3 className="text-[#ffd700] font-bold mb-1">I don't remember character name or username</h3>
                    <p className="text-[#d0d0d0] text-sm">I want to recover my account, but I don't remember the character name or username.</p>
                  </div>
                </label>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!selectedMethod}
                  className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit
                </button>
              </form>

              {/* Back Button */}
              <div className="mt-6 pt-6 border-t border-[#404040]/40">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-[#d0d0d0] hover:text-[#ffd700] transition-colors text-sm"
                >
                  <span>←</span>
                  <span>Back to Login</span>
                </Link>
              </div>
            </div>
          </div>
        </main>
    </div>
  )
}

