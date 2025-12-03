'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '../../services/api'
import type { ApiResponse } from '../../types/account'
import type { NewsComment } from '../../types/news'
import { formatRelativeTime, formatDateTime } from '../../utils/date'
import { makeOutfit } from '../../utils/outfit'

interface CommentWithNews extends NewsComment {
  newsTitle: string
}

interface CommentsResponse {
  comments: CommentWithNews[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const handleAdminError = (err: any, router: { replace: (path: string) => void }): boolean => {
  const status = err.status || err.response?.status

  if (status === 404) {
    router.replace('/not-found')
    return true
  }
  return false
}

export default function AdminCommentsPage() {
  const router = useRouter()
  const [comments, setComments] = useState<CommentWithNews[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [newsIdFilter, setNewsIdFilter] = useState<string>('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  const fetchComments = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      if (search) {
        params.append('search', search)
      }
      if (newsIdFilter) {
        params.append('newsId', newsIdFilter)
      }

      const response = await api.get<ApiResponse<CommentsResponse>>(`/admin/news/comments?${params.toString()}`)
      if (response && response.data) {
        setComments(response.data.comments)
        setTotalPages(response.data.pagination.totalPages)
        setTotal(response.data.pagination.total)
        setIsAuthorized(true)
      }
    } catch (err: any) {
      if (handleAdminError(err, router)) {
        return
      }
      setIsAuthorized(false)
      setError('Error loading comments')
    } finally {
      setLoading(false)
    }
  }, [page, search, newsIdFilter, router])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleDelete = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return
    }

    try {
      setDeletingId(commentId)
      await api.delete(`/admin/news/comments/${commentId}`)
      setComments(comments.filter((c) => c.id !== commentId))
      setTotal(total - 1)
    } catch (err: any) {
      setError(err.message || 'Error deleting comment')
    } finally {
      setDeletingId(null)
    }
  }

  const getOutfitUrl = (comment: CommentWithNews) => {
    try {
      return makeOutfit({
        id: comment.lookType || 128,
        addons: comment.lookAddons || 0,
        head: comment.lookHead || 0,
        body: comment.lookBody || 0,
        legs: comment.lookLegs || 0,
        feet: comment.lookFeet || 0,
      })
    } catch {
      return null
    }
  }

  if (isAuthorized === false) {
    return null
  }

  if (isAuthorized === null || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ffd700] mb-4"></div>
          <p className="text-[#888]">Loading comments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#ffd700] to-[#ffed4e] rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-3xl">💬</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-[#ffd700] mb-2">News Comments</h1>
              <p className="text-[#888]">Monitor and manage all news comments</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border-2 border-red-600 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#e0e0e0] text-sm font-medium mb-2">
                Search (Character, Content, News Title)
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Search comments..."
                className="w-full bg-[#1a1a1a] border-2 border-[#404040]/60 rounded-lg px-4 py-2 text-[#e0e0e0] focus:outline-none focus:border-[#ffd700]"
              />
            </div>
            <div>
              <label className="block text-[#e0e0e0] text-sm font-medium mb-2">
                Filter by News ID
              </label>
              <input
                type="number"
                value={newsIdFilter}
                onChange={(e) => {
                  setNewsIdFilter(e.target.value)
                  setPage(1)
                }}
                placeholder="News ID (optional)"
                className="w-full bg-[#1a1a1a] border-2 border-[#404040]/60 rounded-lg px-4 py-2 text-[#e0e0e0] focus:outline-none focus:border-[#ffd700]"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-4 shadow-2xl mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#888] text-sm">Total Comments</p>
              <p className="text-2xl font-bold text-[#ffd700]">{total.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-[#888] text-sm">Page {page} of {totalPages}</p>
            </div>
          </div>
        </div>

        {/* Comments List */}
        {comments.length === 0 ? (
          <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-8 shadow-2xl text-center">
            <p className="text-[#888] text-lg">No comments found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => {
              const outfitUrl = getOutfitUrl(comment)
              return (
                <div
                  key={comment.id}
                  className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl hover:border-[#ffd700]/50 transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Character Outfit */}
                    <div className="flex-shrink-0">
                      {outfitUrl ? (
                        <img
                          src={outfitUrl}
                          alt={comment.characterName}
                          className="w-16 h-16 rounded border border-[#404040]/50"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded border border-[#404040]/50 bg-[#0a0a0a] flex items-center justify-center">
                          <span className="text-2xl">👤</span>
                        </div>
                      )}
                    </div>

                    {/* Comment Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <Link
                              href={`/characters/${comment.characterName}`}
                              className="text-[#ffd700] font-semibold hover:underline"
                            >
                              {comment.characterName}
                            </Link>
                            <span className="text-[#888] text-sm">•</span>
                            <Link
                              href={`/news/${comment.newsId}`}
                              className="text-[#3b82f6] hover:text-[#60a5fa] hover:underline text-sm"
                            >
                              {comment.newsTitle}
                            </Link>
                            <span className="text-[#888] text-sm">•</span>
                            <span className="text-[#888] text-sm">News ID: {comment.newsId}</span>
                          </div>
                          <p className="text-[#d0d0d0] text-sm whitespace-pre-wrap mb-2">{comment.content}</p>
                          <div className="flex items-center gap-4 text-xs text-[#888]">
                            <span>Comment ID: {comment.id}</span>
                            <span>•</span>
                            <span>{formatDateTime(comment.createdAt)}</span>
                            <span>•</span>
                            <span>{formatRelativeTime(comment.createdAt)}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Link
                            href={`/news/${comment.newsId}`}
                            className="px-3 py-1 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-700 text-blue-300 rounded text-xs font-semibold"
                          >
                            View News
                          </Link>
                          <button
                            onClick={() => handleDelete(comment.id)}
                            disabled={deletingId === comment.id}
                            className="px-3 py-1 bg-red-900/30 hover:bg-red-900/50 border border-red-700 text-red-300 rounded text-xs font-semibold disabled:opacity-50"
                          >
                            {deletingId === comment.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-[#252525] border border-[#404040] rounded-lg text-[#e0e0e0] hover:bg-[#1f1f1f] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-[#e0e0e0]">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-[#252525] border border-[#404040] rounded-lg text-[#e0e0e0] hover:bg-[#1f1f1f] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

