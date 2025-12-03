'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { formatRelativeTime } from '../../utils/date'
import type { News, NewsResponse } from '../../types/news'
import type { ApiResponse } from '../../types/account'
import TiptapEditor from '../admin/TiptapEditor'

export default function NewsSection() {
  const { isAuthenticated } = useAuth()
  const [newsItems, setNewsItems] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchNews()
    if (isAuthenticated) {
      checkAdmin()
    }
  }, [isAuthenticated])

  const checkAdmin = async () => {
    try {
      await api.get('/admin/stats')
      setIsAdmin(true)
    } catch {
      setIsAdmin(false)
    }
  }

  const fetchNews = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: '1',
        limit: '5',
      })
      const response = await api.get<ApiResponse<NewsResponse>>(`/news?${params.toString()}`, { public: true })
      if (response && response.data) {
        setNewsItems(response.data.news || [])
      }
    } catch (err) {
      console.error('Error fetching news:', err)
      setNewsItems([])
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (news: News) => {
    setEditingId(news.id)
    setEditTitle(news.title)
    setEditContent(news.content)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditContent('')
  }

  const handleSaveEdit = async (newsId: number) => {
    if (!editTitle.trim() || !editContent.trim()) {
      return
    }

    setSaving(true)
    try {
      await api.put(`/admin/news/${newsId}`, {
        title: editTitle,
        content: editContent,
      })
      setEditingId(null)
      fetchNews()
    } catch (err) {
      console.error('Error updating news:', err)
    } finally {
      setSaving(false)
    }
  }


  if (loading) {
    return (
      <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border border-[#404040]/60 p-4 sm:p-6 shadow-xl">
        <h2 className="text-[#ffd700] text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 pb-3 border-b-2 border-[#ffd700]/30">Latest News</h2>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ffd700]"></div>
          <p className="text-[#888] mt-4 text-sm">Loading news...</p>
        </div>
      </div>
    )
  }

  if (newsItems.length === 0) {
    return (
      <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border border-[#404040]/60 p-4 sm:p-6 shadow-xl">
        <h2 className="text-[#ffd700] text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 pb-3 border-b-2 border-[#ffd700]/30">Latest News</h2>
        <div className="text-center py-8">
          <p className="text-[#888] text-sm">No news available at the moment.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border border-[#404040]/60 p-4 sm:p-6 shadow-xl">
      <h2 className="text-[#ffd700] text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 pb-3 border-b-2 border-[#ffd700]/30">Latest News</h2>

      <div className="space-y-6">
        {newsItems.map((item) => {
          const isEditing = editingId === item.id
          const icon = item.icon || '📰'

          return (
            <div
              key={item.id}
              className="bg-[#1f1f1f]/80 rounded-lg border border-[#404040]/50 p-4 sm:p-6 hover:border-[#ffd700]/60 hover:bg-[#252525]/90 transition-all duration-200 shadow-md"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-[#404040]/50">
                <div className="flex items-start gap-3 sm:gap-4 flex-1">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border border-[#404040]/50 bg-gradient-to-br from-[#ffd700]/20 to-[#ffd700]/10 relative flex items-center justify-center">
                    <div className="text-2xl sm:text-3xl">{icon}</div>
                  </div>

                  {/* Title and Meta */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-[#252525] border border-[#404040] rounded-lg text-[#e0e0e0] focus:outline-none focus:border-[#ffd700] mb-2"
                      />
                    ) : (
                      <Link href={`/news/${item.id}`}>
                        <h3 className="text-[#ffd700] font-bold text-lg sm:text-xl mb-2 hover:text-[#ffd33d] hover:underline cursor-pointer">
                          {item.title}
                        </h3>
                      </Link>
                    )}
                    <div className="flex items-center gap-3 flex-wrap text-xs text-[#888]">
                      <span>{formatRelativeTime(item.createdAt)}</span>
                      {item.author && (
                        <>
                          <span>•</span>
                          <Link
                            href={`/characters/${item.author}`}
                            className="text-[#d0d0d0] hover:text-[#ffd700] hover:underline"
                          >
                            by {item.author}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Admin Actions */}
                {isAdmin && !isEditing && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="px-3 py-1 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-700 text-blue-300 rounded text-xs font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                )}

                {isEditing && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(item.id)}
                      disabled={saving}
                      className="px-3 py-1 bg-green-900/30 hover:bg-green-900/50 border border-green-700 text-green-300 rounded text-xs font-semibold disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 bg-gray-900/30 hover:bg-gray-900/50 border border-gray-700 text-gray-300 rounded text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Content */}
              {isEditing ? (
                <div className="mb-4">
                  <TiptapEditor
                    value={editContent}
                    onChange={setEditContent}
                    placeholder="Enter news content here..."
                  />
                </div>
              ) : (
                <div
                  className="news-content text-[#d0d0d0] text-sm sm:text-base leading-relaxed mb-4"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              )}

              {/* Link to full page */}
              {!isEditing && (
                <div className="mt-4 pt-4 border-t border-[#404040]/30">
                  <Link
                    href={`/news/${item.id}`}
                    className="text-[#ffd700] hover:text-[#ffd33d] text-sm font-semibold hover:underline"
                  >
                    View full page and comments →
                  </Link>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <style jsx global>{`
        .news-content h1,
        .news-content h2,
        .news-content h3 {
          color: #ffd700;
          font-weight: bold;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .news-content h1 {
          font-size: 1.5rem;
        }
        .news-content h2 {
          font-size: 1.25rem;
        }
        .news-content h3 {
          font-size: 1.1rem;
        }
        .news-content p {
          margin-bottom: 0.75rem;
        }
        .news-content ul,
        .news-content ol {
          margin-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .news-content li {
          margin-bottom: 0.25rem;
        }
        .news-content strong {
          color: #ffd700;
          font-weight: bold;
        }
        .news-content blockquote {
          border-left: 4px solid #ffd700;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #d4d4d4;
        }
        .news-content hr {
          border: none;
          border-top: 2px solid #404040;
          margin: 1rem 0;
        }
      `}</style>
    </div>
  )
}
