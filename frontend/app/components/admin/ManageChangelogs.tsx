'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '../../services/api'
import { formatDate } from '../../utils/date'
import type { ChangelogEntry, ChangelogsResponse } from '../../types/changelog'

export default function ManageChangelogs() {
  const [changelogs, setChangelogs] = useState<ChangelogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
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

  useEffect(() => {
    const handleChangelogCreated = () => {
      fetchChangelogs()
    }
    window.addEventListener('changelog-created', handleChangelogCreated)
    return () => {
      window.removeEventListener('changelog-created', handleChangelogCreated)
    }
  }, [fetchChangelogs])

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this changelog?')) {
      return
    }

    try {
      setDeletingId(id)
      await api.delete(`/admin/changelogs/${id}`)
      setChangelogs(changelogs.filter((c) => c.id !== id))
    } catch (err: any) {
      setError(err.message || 'Error deleting changelog')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl">
      <h2 className="text-2xl font-bold text-[#ffd700] mb-4">Manage Changelogs</h2>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ffd700]"></div>
          <p className="text-[#888] mt-4">Loading changelogs...</p>
        </div>
      ) : changelogs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#888] text-lg">No changelogs found</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {changelogs.map((changelog) => (
              <div
                key={changelog.id}
                className="bg-[#1f1f1f]/80 rounded-lg border border-[#404040]/50 p-4 hover:border-[#ffd700]/60 hover:bg-[#252525]/90 transition-all duration-200 shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-[#888] text-xs">{formatDate(changelog.createdAt)}</span>
                      <span className="text-[#ffd700] text-xs font-semibold">[{changelog.type.toUpperCase()}]</span>
                      <span className="text-[#d0d0d0] text-sm font-medium">{changelog.title}</span>
                      {changelog.version && (
                        <span className="text-[#888] text-xs">v{changelog.version}</span>
                      )}
                    </div>
                    {changelog.description && (
                      <p className="text-[#d0d0d0] text-xs leading-relaxed line-clamp-2">
                        {changelog.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(changelog.id)}
                    disabled={deletingId === changelog.id}
                    className="bg-red-900/30 hover:bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold flex-shrink-0"
                  >
                    {deletingId === changelog.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4 border-t border-[#404040]">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-[#404040] hover:bg-[#505050] disabled:bg-[#2a2a2a] disabled:text-[#666] disabled:cursor-not-allowed text-white rounded-lg transition-all"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-[#e0e0e0] flex items-center">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-[#404040] hover:bg-[#505050] disabled:bg-[#2a2a2a] disabled:text-[#666] disabled:cursor-not-allowed text-white rounded-lg transition-all"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

