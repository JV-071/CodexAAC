'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '../services/api'
import { authService } from '../services/auth'
import { useAuth } from '../contexts/AuthContext'

interface LoginResponse {
  token?: string
  requires2FA?: boolean
  message?: string
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading, setAuthenticated } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [twoFactorToken, setTwoFactorToken] = useState('')
  const [requires2FA, setRequires2FA] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const expired = searchParams.get('expired')
    const unauthorized = searchParams.get('unauthorized')
    
    if (expired) {
      setError('Your session has expired. Please login again.')
    } else if (unauthorized) {
      setError('You are not authorized. Please login again.')
    } else if (isAuthenticated && !isLoading) {
      router.push('/account')
    }
  }, [searchParams, router, isAuthenticated, isLoading])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await api.post<LoginResponse>('/login', {
        email: formData.email,
        password: formData.password,
        token: requires2FA ? twoFactorToken : undefined,
      }, { public: true })

      if (data.requires2FA) {
        setRequires2FA(true)
        setError('')
        return
      }

      // Save token (dev only) and update context
      if (data.token) {
        authService.saveToken(data.token)
      }
      setAuthenticated(true)
      router.push('/account')
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.')
      if (err.message && !err.message.includes('2FA')) {
        setRequires2FA(false)
        setTwoFactorToken('')
      }
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div>
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                <span className="text-[#ffd700]">Account</span>
                <span className="text-[#3b82f6]"> Login</span>
              </h1>
              <p className="text-[#d0d0d0] text-sm">Checking authentication...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div>
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              <span className="text-[#ffd700]">Account</span>
              <span className="text-[#3b82f6]"> Login</span>
            </h1>
            <p className="text-[#d0d0d0] text-sm">Sign in to your account to continue</p>
          </div>

          {/* Login Form */}
          <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 sm:p-8 shadow-2xl ring-2 ring-[#ffd700]/10">
            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-300 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-[#e0e0e0] text-sm font-medium mb-2">
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-[#1a1a1a] border-2 border-[#404040]/60 rounded-lg px-4 py-3 text-[#e0e0e0] focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all placeholder:text-[#666]"
                  placeholder="Enter your email"
                  disabled={loading}
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-[#e0e0e0] text-sm font-medium mb-2">
                  Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-[#1a1a1a] border-2 border-[#404040]/60 rounded-lg px-4 py-3 text-[#e0e0e0] focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all placeholder:text-[#666]"
                  placeholder="Enter your password"
                  disabled={loading || requires2FA}
                  required
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
                    name="twoFactorToken"
                    type="text"
                    value={twoFactorToken}
                    onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-[#1a1a1a] border-2 border-[#404040]/60 rounded-lg px-4 py-3 text-[#e0e0e0] focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all placeholder:text-[#666] text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    disabled={loading}
                    required
                    autoFocus
                  />
                  <p className="mt-2 text-sm text-[#888]">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>
              )}

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="w-4 h-4 bg-[#1a1a1a] border-2 border-[#404040]/60 rounded text-[#ffd700] focus:ring-[#ffd700] focus:ring-2"
                    disabled={loading}
                  />
                  <label htmlFor="rememberMe" className="ml-2 text-sm text-[#d0d0d0]">
                    Remember me
                  </label>
                </div>
                <Link
                  href="/account/recover"
                  className="text-sm text-[#3b82f6] hover:text-[#60a5fa] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[#d0d0d0] text-sm">
                Don't have an account?{' '}
                <Link
                  href="/create-account"
                  className="text-[#ffd700] hover:text-[#ffed4e] hover:underline font-medium"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              <span className="text-[#ffd700]">Account</span>
              <span className="text-[#3b82f6]"> Login</span>
            </h1>
            <p className="text-[#d0d0d0] text-sm">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
