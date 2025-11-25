'use client'

import { useState } from 'react'
import { api } from '../../services/api'

interface CreateChangelogSectionProps {
  onSuccess?: () => void
}

const CHANGELOG_TYPES = [
  { value: 'update', label: 'Update' },
  { value: 'feature', label: 'Feature' },
  { value: 'bugfix', label: 'Bug Fix' },
  { value: 'hotfix', label: 'Hotfix' },
  { value: 'other', label: 'Other' },
] as const

const MAX_VERSION_LENGTH = 50
const MAX_TITLE_LENGTH = 255
const MAX_DESCRIPTION_LENGTH = 5000

export default function CreateChangelogSection({ onSuccess }: CreateChangelogSectionProps) {
  const [version, setVersion] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('update')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const trimmedVersion = version.trim()
    const trimmedTitle = title.trim()
    const trimmedDescription = description.trim()

    if (trimmedVersion.length > MAX_VERSION_LENGTH) {
      setError(`Version is too long (max ${MAX_VERSION_LENGTH} characters)`)
      setLoading(false)
      return
    }

    if (trimmedTitle.length > MAX_TITLE_LENGTH) {
      setError(`Title is too long (max ${MAX_TITLE_LENGTH} characters)`)
      setLoading(false)
      return
    }

    if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
      setError(`Description is too long (max ${MAX_DESCRIPTION_LENGTH} characters)`)
      setLoading(false)
      return
    }

    try {
      await api.post('/admin/changelogs', {
        version: trimmedVersion,
        title: trimmedTitle,
        description: trimmedDescription || null,
        type: type,
      })

      setVersion('')
      setTitle('')
      setDescription('')
      setType('update')
      setSuccess(true)
      
      if (onSuccess) {
        onSuccess()
      }

      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Error creating changelog')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl mb-8">
      <h2 className="text-2xl font-bold text-[#ffd700] mb-4">Create Changelog</h2>
      
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 mb-4">
          <p className="text-green-300 text-sm">Changelog created successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[#d0d0d0] text-sm font-medium mb-2">
              Version <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g., 1.0.0"
              required
              maxLength={MAX_VERSION_LENGTH}
              className="w-full bg-[#1a1a1a] border-2 border-[#404040] rounded-lg px-4 py-2 text-[#e0e0e0] focus:outline-none focus:border-[#ffd700] transition-all"
            />
          </div>

          <div>
            <label className="block text-[#d0d0d0] text-sm font-medium mb-2">
              Type <span className="text-red-400">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
              className="w-full bg-[#1a1a1a] border-2 border-[#404040] rounded-lg px-4 py-2 text-[#e0e0e0] focus:outline-none focus:border-[#ffd700] transition-all"
            >
              {CHANGELOG_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[#d0d0d0] text-sm font-medium mb-2">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Changelog title"
            required
            maxLength={MAX_TITLE_LENGTH}
            className="w-full bg-[#1a1a1a] border-2 border-[#404040] rounded-lg px-4 py-2 text-[#e0e0e0] focus:outline-none focus:border-[#ffd700] transition-all"
          />
        </div>

        <div>
          <label className="block text-[#d0d0d0] text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of the changelog..."
            rows={4}
            maxLength={MAX_DESCRIPTION_LENGTH}
            className="w-full bg-[#1a1a1a] border-2 border-[#404040] rounded-lg px-4 py-2 text-[#e0e0e0] focus:outline-none focus:border-[#ffd700] transition-all resize-none"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#ffd700] hover:bg-[#ffed4e] text-[#0a0a0a] font-bold px-6 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Changelog'}
          </button>
        </div>
      </form>
    </div>
  )
}

