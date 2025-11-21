'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '../services/api'

export default function CreateAccountPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    whereFound: '',
    acceptTerms: false
  })

  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    whereFound: '',
    acceptTerms: '',
    general: ''
  })

  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = 'checked' in e.target ? e.target.checked : false
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear specific error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    // Clear general error
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }))
    }
  }

  const validateForm = () => {
    let isValid = true
    const newErrors = {
      email: '',
      password: '',
      confirmPassword: '',
      whereFound: '',
      acceptTerms: '',
      general: ''
    }

    if (!formData.email) {
      newErrors.email = 'Email is required'
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
      isValid = false
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
      isValid = false
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
      isValid = false
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
      isValid = false
    }

    if (!formData.whereFound) {
      newErrors.whereFound = 'Please select where you found us'
      isValid = false
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms of service'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({ email: '', password: '', confirmPassword: '', whereFound: '', acceptTerms: '', general: '' })
    setSuccessMessage('')

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      await api.post('/register', {
        email: formData.email,
        password: formData.password
      }, { public: true })

      setSuccessMessage('Account created successfully! You can now log in.')
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        whereFound: '',
        acceptTerms: false
      })
    } catch (err: any) {
      setErrors(prev => ({
        ...prev,
        general: err.message || 'Error creating account. Please try again.'
      }))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              <span className="text-[#ffd700]">Create</span>
              <span className="text-[#3b82f6]"> Account</span>
            </h1>
            <p className="text-[#d0d0d0] text-sm">Create your account and start your adventure</p>
          </div>

          {/* Register Form */}
          <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 sm:p-8 shadow-2xl ring-2 ring-[#ffd700]/10">
            {errors.general && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-300 text-sm">
                {errors.general}
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded text-green-300 text-sm">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-[#e0e0e0] text-sm font-medium mb-2">
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-[#1a1a1a] border-2 border-[#404040]/60 rounded-lg px-4 py-3 text-[#e0e0e0] focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all placeholder:text-[#666]"
                  placeholder="your@email.com"
                  disabled={isLoading}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
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
                  disabled={isLoading}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                <p className="mt-1 text-xs text-[#666]">Minimum 6 characters</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-[#e0e0e0] text-sm font-medium mb-2">
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-[#1a1a1a] border-2 border-[#404040]/60 rounded-lg px-4 py-3 text-[#e0e0e0] focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all placeholder:text-[#666]"
                  placeholder="Confirm your password"
                  disabled={isLoading}
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>

              {/* Where did you find us */}
              <div>
                <label htmlFor="whereFound" className="block text-[#e0e0e0] text-sm font-medium mb-2">
                  Where did you find us? *
                </label>
                <select
                  id="whereFound"
                  name="whereFound"
                  value={formData.whereFound}
                  onChange={handleChange}
                  className="w-full bg-[#1a1a1a] border-2 border-[#404040]/60 rounded-lg px-4 py-3 text-[#e0e0e0] focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all"
                  disabled={isLoading}
                >
                  <option value="">Select an option</option>
                  <option value="facebook" className="bg-[#1a1a1a]">Facebook</option>
                  <option value="instagram" className="bg-[#1a1a1a]">Instagram</option>
                  <option value="youtube" className="bg-[#1a1a1a]">Youtube</option>
                  <option value="google" className="bg-[#1a1a1a]">Google</option>
                  <option value="twitch" className="bg-[#1a1a1a]">Twitch</option>
                  <option value="otservlist" className="bg-[#1a1a1a]">OTServlist</option>
                  <option value="friends" className="bg-[#1a1a1a]">Friends</option>
                  <option value="others" className="bg-[#1a1a1a]">Others</option>
                </select>
                {errors.whereFound && <p className="text-red-500 text-xs mt-1">{errors.whereFound}</p>}
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start">
                <input
                  id="acceptTerms"
                  name="acceptTerms"
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 bg-[#1a1a1a] border-2 border-[#404040]/60 rounded text-[#ffd700] focus:ring-[#ffd700] focus:ring-2"
                  disabled={isLoading}
                />
                <label htmlFor="acceptTerms" className="ml-2 text-sm text-[#d0d0d0]">
                  I accept the <Link href="/legal/terms" className="text-[#ffd700] hover:underline">terms of service</Link> and <Link href="/legal/privacy" className="text-[#ffd700] hover:underline">privacy policy</Link> *
                </label>
              </div>
              {errors.acceptTerms && <p className="text-red-500 text-xs mt-1">{errors.acceptTerms}</p>}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#ffd700] hover:bg-[#ffed4e] text-[#0a0a0a] font-bold py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-[#d0d0d0] hover:text-[#ffd700] text-sm transition-colors"
              >
                Already have an account? Log in
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
