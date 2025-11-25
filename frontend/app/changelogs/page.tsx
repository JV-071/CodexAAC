'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { api } from '../services/api'
import { formatDate } from '../utils/date'
import type { ChangelogEntry, ChangelogsResponse } from '../types/changelog'

export default function ChangelogsPage() {
  const [changelogs, setChangelogs] = useState<ChangelogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchChangelogs = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })

      const response = await api.get<{ data: ChangelogsResponse }>(`/changelogs?${params.toString()}`, { public: true })
      if (response.data) {
        setChangelogs(response.data.changelogs || [])
        setTotalPages(response.data.pagination?.totalPages || 1)
      }
    } catch (err: any) {
      setError(err.message || 'Error loading changelogs')
      setChangelogs([])
    } finally {
      setLoading(false)
    }
  }, [page])

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
    <div>
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold">
              <span className="text-[#ffd700]">CHANGE</span>
              <span className="text-[#3b82f6]"> LOGS</span>
            </h1>
            <Link
              href="/"
              className="text-[#3b82f6] hover:text-[#60a5fa] text-sm hover:underline"
            >
              ← Back to Home
            </Link>
          </div>

          {loading ? (
            <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl text-center">
              <div className="text-[#ffd700] text-2xl font-bold mb-4">Loading changelogs...</div>
              <div className="text-[#d0d0d0]">Please wait</div>
            </div>
          ) : error ? (
            <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center">
              <h2 className="text-red-300 text-2xl font-bold mb-2">Error</h2>
              <p className="text-red-200">{error}</p>
            </div>
          ) : changelogs.length === 0 ? (
            <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl text-center">
              <div className="text-[#ffd700] text-2xl font-bold mb-4">No Changelogs</div>
              <div className="text-[#d0d0d0]">No changelogs available at this time.</div>
            </div>
          ) : (
            <>
              <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl">
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
                                {changelog.version && (
                                  <span className="text-[#888] text-xs">v{changelog.version}</span>
                                )}
                              </div>
                              {displayText.length > 80 && (
                                <button
                                  onClick={() => toggleExpand(changelog.id)}
                                  className="text-[#666] hover:text-[#ffd700] transition-colors flex-shrink-0"
                                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                >
                                  {isExpanded ? '−' : '+'}
                                </button>
                              )}
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
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-[#1a1a1a] border-2 border-[#404040]/60 rounded-lg text-[#e0e0e0] hover:border-[#3b82f6]/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <span className="text-[#d0d0d0] px-4">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-[#1a1a1a] border-2 border-[#404040]/60 rounded-lg text-[#e0e0e0] hover:border-[#3b82f6]/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

