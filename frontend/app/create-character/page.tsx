'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function CreateCharacterPage() {
  const [formData, setFormData] = useState({
    characterName: '',
    vocation: '',
    world: '',
    sex: 'male',
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const vocations = [
    { value: 'sorcerer', label: 'Sorcerer', icon: '🧙' },
    { value: 'druid', label: 'Druid', icon: '🌿' },
    { value: 'paladin', label: 'Paladin', icon: '🏹' },
    { value: 'knight', label: 'Knight', icon: '⚔️' },
  ]

  const worlds = [
    { value: 'retro1', label: 'Retro-PVP 1' },
    { value: 'retro2', label: 'Retro-PVP 2' },
    { value: 'retro3', label: 'Retro-PVP 3' },
    { value: 'retro4', label: 'Retro-PVP 4' },
    { value: 'optional1', label: 'Optional-PVP 1' },
    { value: 'optional2', label: 'Optional-PVP 2' },
    { value: 'optional3', label: 'Optional-PVP 3' },
    { value: 'optional4', label: 'Optional-PVP 4' },
    { value: 'open1', label: 'Open-PVP 1' },
    { value: 'open2', label: 'Open-PVP 2' },
    { value: 'open3', label: 'Open-PVP 3' },
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.characterName || !formData.vocation || !formData.world) {
      setError('Please fill in all fields')
      return false
    }

    if (formData.characterName.length < 3 || formData.characterName.length > 20) {
      setError('Character name must be between 3 and 20 characters')
      return false
    }

    const nameRegex = /^[a-zA-Z\s]+$/
    if (!nameRegex.test(formData.characterName)) {
      setError('Character name must contain only letters')
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
      console.log('Create Character:', formData)
      
      // Simulation of creation
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setSuccess(true)
      setFormData({
        characterName: '',
        vocation: '',
        world: '',
        sex: 'male',
      })
    } catch (err) {
      setError('Error creating character. Please try again.')
    } finally {
      setLoading(false)
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
                <span className="text-[#3b82f6]"> Character</span>
              </h1>
              <p className="text-[#d0d0d0] text-sm">Create your character and start your adventure</p>
            </div>

            {/* Create Character Form */}
            <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 sm:p-8 shadow-2xl ring-2 ring-[#ffd700]/10">
              {error && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-300 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded text-green-300 text-sm">
                  Character created successfully! You can log in now.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Character Name */}
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
                    placeholder="Enter character name"
                    disabled={loading}
                  />
                  <p className="mt-1 text-xs text-[#666]">Between 3 and 20 characters, letters only</p>
                </div>

                {/* Sex Selection */}
                <div>
                  <label className="block text-[#e0e0e0] text-sm font-medium mb-3">
                    Sex *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="sex"
                        value="male"
                        checked={formData.sex === 'male'}
                        onChange={handleChange}
                        className="sr-only peer"
                        disabled={loading}
                      />
                      <div className="bg-[#1a1a1a] border-2 border-[#404040]/60 rounded-lg p-4 text-center transition-all peer-checked:border-[#3b82f6] peer-checked:bg-[#3b82f6]/10 hover:border-[#505050]">
                        <div className="text-3xl mb-2">👨</div>
                        <span className="text-[#e0e0e0] text-sm font-medium">Male</span>
                      </div>
                    </label>
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="sex"
                        value="female"
                        checked={formData.sex === 'female'}
                        onChange={handleChange}
                        className="sr-only peer"
                        disabled={loading}
                      />
                      <div className="bg-[#1a1a1a] border-2 border-[#404040]/60 rounded-lg p-4 text-center transition-all peer-checked:border-[#3b82f6] peer-checked:bg-[#3b82f6]/10 hover:border-[#505050]">
                        <div className="text-3xl mb-2">👩</div>
                        <span className="text-[#e0e0e0] text-sm font-medium">Female</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Vocation Selection */}
                <div>
                  <label htmlFor="vocation" className="block text-[#e0e0e0] text-sm font-medium mb-3">
                    Vocation *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {vocations.map((voc) => (
                      <label key={voc.value} className="cursor-pointer">
                        <input
                          type="radio"
                          name="vocation"
                          value={voc.value}
                          checked={formData.vocation === voc.value}
                          onChange={handleChange}
                          className="sr-only peer"
                          disabled={loading}
                        />
                        <div className="bg-[#1a1a1a] border-2 border-[#404040]/60 rounded-lg p-4 text-center transition-all peer-checked:border-[#ffd700] peer-checked:bg-[#ffd700]/10 hover:border-[#505050]">
                          <div className="text-2xl mb-1">{voc.icon}</div>
                          <span className="text-[#e0e0e0] text-sm font-medium">{voc.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* World Selection */}
                <div>
                  <label htmlFor="world" className="block text-[#e0e0e0] text-sm font-medium mb-2">
                    World *
                  </label>
                  <select
                    id="world"
                    name="world"
                    value={formData.world}
                    onChange={handleChange}
                    className="w-full bg-[#1a1a1a] border-2 border-[#404040]/60 rounded-lg px-4 py-3 text-[#e0e0e0] focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all"
                    disabled={loading}
                  >
                    <option value="">Select a world</option>
                    {worlds.map((world) => (
                      <option key={world.value} value={world.value} className="bg-[#1a1a1a]">
                        {world.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#ffd700] hover:bg-[#ffed4e] text-[#0a0a0a] font-bold py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating character...' : 'Create Character'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/account"
                  className="text-[#d0d0d0] hover:text-[#ffd700] text-sm transition-colors"
                >
                  Back to Account Management
                </Link>
              </div>
            </div>
          </div>
        </main>
    </div>
  )
}

