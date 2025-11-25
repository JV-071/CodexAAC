'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { api } from '../../services/api'
import { formatDate } from '../../utils/date'
import type { ChangelogEntry, ChangelogsApiResponse } from '../../types/changelog'

export default function ChangeLogs() {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())
  const [changelogs, setChangelogs] = useState<ChangelogEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchChangelogs = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', '1')
      params.set('limit', '5')

      const response = await api.get<ChangelogsApiResponse>(`/changelogs?${params.toString()}`, { public: true })
      if (response.data) {
        setChangelogs(response.data.changelogs || [])
      }
    } catch (err: any) {
      console.error('Error loading changelogs:', err)
      setChangelogs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchChangelogs()
  }, [fetchChangelogs])

  const toggleExpand = useCallback((id: number) => {
    setExpandedItems((prev) => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(id)) {
        newExpanded.delete(id)
      } else {
        newExpanded.add(id)
      }
      return newExpanded
    })
  }, [])

  return (
    <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border border-[#404040]/60 p-4 sm:p-6 shadow-xl mb-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 border-b border-[#404040]/40">
        <h2 className="text-[#ffd700] text-xl sm:text-2xl font-bold flex items-center gap-2">
          <span>▲</span> CHANGE LOGS
        </h2>
        <Link
          href="/changelogs"
          className="text-[#3b82f6] hover:text-[#60a5fa] text-xs sm:text-sm hover:underline"
        >
          View All →
        </Link>
      </div>
      
      {loading ? (
        <div className="text-center py-4 text-[#d0d0d0]">Loading changelogs...</div>
      ) : changelogs.length === 0 ? (
        <div className="text-center py-4 text-[#d0d0d0]">No changelogs available</div>
      ) : (
        <div className="space-y-3">
          {changelogs.map((changelog) => {
          const isExpanded = expandedItems.has(changelog.id)
          const isImportant = changelog.type === 'hotfix' || changelog.type === 'bugfix'
          const displayText = changelog.description || ''
          
          return (
            <div
              key={changelog.id}
              className={`bg-[#1f1f1f]/80 rounded-lg border border-[#404040]/50 p-4 hover:border-[#ffd700]/60 hover:bg-[#252525]/90 transition-all duration-200 shadow-md ${isImportant ? 'border-yellow-600/50' : ''}`}
            >
              <div className="flex items-start gap-3">
                {isImportant && (
                  <div className="text-yellow-500 text-lg flex-shrink-0 mt-0.5">⚠️</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[#888] text-xs">{formatDate(changelog.createdAt)}</span>
                      <span className="text-[#ffd700] text-xs font-semibold">[{changelog.type.toUpperCase()}]</span>
                      <span className="text-[#d0d0d0] text-sm font-medium">{changelog.title}</span>
                    </div>
                    <button
                      onClick={() => toggleExpand(changelog.id)}
                      className="text-[#666] hover:text-[#ffd700] transition-colors flex-shrink-0"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? '−' : '+'}
                    </button>
                  </div>
                  <p className="text-[#d0d0d0] text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                    {isExpanded ? displayText : (displayText.length > 80 ? displayText.substring(0, 80) + '...' : displayText)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        </div>
      )}
    </div>
  )
}
