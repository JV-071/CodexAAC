'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '../../services/api'
import { authService } from '../../services/auth'

interface LoginResponse {
  token?: string
  requires2FA?: boolean
  message?: string
}

export default function LoginBox() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [twoFactorToken, setTwoFactorToken] = useState('')
  const [requires2FA, setRequires2FA] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await api.post<LoginResponse>('/login', {
        email,
        password,
        token: requires2FA ? twoFactorToken : undefined,
      }, { public: true })

      // Check if 2FA is required
      if (data.requires2FA) {
        setRequires2FA(true)
        setError('')
        return
      }

      // Save token using auth service
      if (data.token) {
        authService.saveToken(data.token)
        // Redirect or update state
        window.location.href = '/account'
      } else {
        setError('Login failed. Please try again.')
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.')
      // Reset 2FA state on error (unless it's a 2FA-related error)
      if (err.message && !err.message.includes('2FA') && !err.message.includes('token')) {
        setRequires2FA(false)
        setTwoFactorToken('')
      }
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
            disabled={loading || requires2FA}
          />
        </div>

        {/* 2FA Token */}
        {requires2FA && (
          <div>
            <label htmlFor="twoFactorToken" className="block text-[#e0e0e0] text-sm font-medium mb-2">
              Two-Factor Authentication Code *
            </label>
            <input
              id="twoFactorToken"
              type="text"
              value={twoFactorToken}
              onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full bg-[#1a1a1a] border-2 border-[#404040]/60 rounded-lg px-4 py-2.5 sm:py-3 text-[#e0e0e0] focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all placeholder:text-[#666] text-center text-xl sm:text-2xl tracking-widest"
              placeholder="000000"
              maxLength={6}
              disabled={loading}
              autoFocus
            />
            <p className="mt-1 text-xs text-[#888]">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold py-2.5 sm:py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (requires2FA ? 'Verifying...' : 'Logging in...') : (requires2FA ? 'Verify & Login' : 'Login')}
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
