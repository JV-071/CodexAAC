'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

type RecoveryMethod = 'character' | 'username' | 'neither'

export default function RecoverAccountFormPage() {
  const params = useParams()
  const router = useRouter()
  const method = params.method as RecoveryMethod

  const [formData, setFormData] = useState({
    email: '',
    characterName: '',
    username: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.email) {
      setError('Email is required')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return false
    }

    if (method === 'character' && !formData.characterName) {
      setError('Character name is required')
      return false
    }

    if (method === 'username' && !formData.username) {
      setError('Username is required')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Here you will make the API call
      console.log('Recovery request:', { method, ...formData })
      
      // Simulation of sending
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setSuccess(true)
      setFormData({
        email: '',
        characterName: '',
        username: '',
      })
    } catch (err) {
      setError('Error sending recovery request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getTitle = () => {
    switch (method) {
      case 'character':
        return 'Recover Account - Character Name'
      case 'username':
        return 'Recover Account - Username'
      case 'neither':
        return 'Recover Account - Alternative Method'
      default:
        return 'Recover Account'
    }
  }

  const getDescription = () => {
    switch (method) {
      case 'character':
        return 'Enter your email and character name to recover your account.'
      case 'username':
        return 'Enter your email and username to recover your account.'
      case 'neither':
        return 'Enter your email and we will help you recover your account using alternative methods.'
      default:
        return 'Recover your account'
    }
  }

  // Redirect if invalid method
  if (!['character', 'username', 'neither'].includes(method)) {
    router.push('/account/recover')
    return null
  }

  return (
    <div>
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                <span className="text-[#ffd700]">{getTitle()}</span>
              </h1>
              <p className="text-[#d0d0d0] text-sm">{getDescription()}</p>
            </div>

            {/* Recovery Form */}
            <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 sm:p-8 shadow-2xl ring-2 ring-[#ffd700]/10">
              {error && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-300 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded text-green-300 text-sm">
                  Recovery request sent successfully! Please check your email for further instructions.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email - Always Required */}
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
                    placeholder="Enter your email address"
                    disabled={loading}
                    required
                  />
                </div>

                {/* Character Name - Only for character method */}
                {method === 'character' && (
                  <div>
                    <label htmlFor="characterName" className="block text-[#e0e0e0] text-sm font-medium mb-2">
                      Character Name *
                    </label>
                    <input
                      id="characterName"
                      name="characterName"
                      type="text"
                      value={formData.characterName}
                      onChange={handleChange}
                      className="w-full bg-[#1a1a1a] border-2 border-[#404040]/60 rounded-lg px-4 py-3 text-[#e0e0e0] focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all placeholder:text-[#666]"
                      placeholder="Enter your character name"
                      disabled={loading}
                      required
                    />
                  </div>
                )}

                {/* Username - Only for username method */}
                {method === 'username' && (
                  <div>
                    <label htmlFor="username" className="block text-[#e0e0e0] text-sm font-medium mb-2">
                      Username *
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full bg-[#1a1a1a] border-2 border-[#404040]/60 rounded-lg px-4 py-3 text-[#e0e0e0] focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all placeholder:text-[#666]"
                      placeholder="Enter your username"
                      disabled={loading}
                      required
                    />
                  </div>
                )}

                {/* Additional Info for neither method */}
                {method === 'neither' && (
                  <div className="bg-[#1a1a1a]/90 rounded-lg border-2 border-[#404040]/60 p-4">
                    <p className="text-[#d0d0d0] text-sm leading-relaxed">
                      We will send recovery instructions to your email address. Please provide as much information as possible 
                      to help us verify your account ownership. Our support team will review your request and contact you via email.
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending request...' : 'Send Recovery Request'}
                </button>
              </form>

              {/* Back Button */}
              <div className="mt-6 pt-6 border-t border-[#404040]/40">
                <Link
                  href="/account/recover"
                  className="inline-flex items-center gap-2 text-[#d0d0d0] hover:text-[#ffd700] transition-colors text-sm"
                >
                  <span>←</span>
                  <span>Back to Recovery Options</span>
                </Link>
              </div>
            </div>
          </div>
        </main>
    </div>
  )
}

