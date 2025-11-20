'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '../../services/api'
import { authService } from '../../services/auth'

export default function LoginBox() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await api.post<{ token: string }>('/login', { email, password })

      // Save token using auth service
      authService.saveToken(data.token)

      // Redirect or update state
      window.location.href = '/account'
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-4 sm:p-6 shadow-2xl ring-2 ring-[#ffd700]/10">
      <h2 className="text-[#ffd700] text-xl sm:text-2xl font-bold mb-4 sm:mb-6 pb-3 border-b border-[#404040]/40">Account Login</h2>

      <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-[#e0e0e0] text-sm font-medium mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#1a1a1a] border-2 border-[#404040]/60 rounded-lg px-4 py-2.5 sm:py-3 text-[#e0e0e0] focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all placeholder:text-[#666] text-sm sm:text-base"
            placeholder="Email Address"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-[#e0e0e0] text-sm font-medium mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#1a1a1a] border-2 border-[#404040]/60 rounded-lg px-4 py-2.5 sm:py-3 text-[#e0e0e0] focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all placeholder:text-[#666] text-sm sm:text-base"
            placeholder="Enter your password"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold py-2.5 sm:py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="mt-4 pt-4 border-t border-[#404040]/40">
        <Link
          href="/account/recover"
          className="block text-center text-[#3b82f6] hover:text-[#60a5fa] text-sm hover:underline"
        >
          Forgot password?
        </Link>
      </div>
    </div>
  )
}
