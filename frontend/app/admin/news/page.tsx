'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../services/api'
import type { ApiResponse } from '../../types/account'
import type { News, NewsResponse, SingleNewsApiResponse } from '../../types/news'
import type { Character, CharactersApiResponse } from '../../types/character'
import TiptapEditor from '../../components/admin/TiptapEditor'
import { formatDate } from '../../utils/date'

export default function AdminNewsPage() {
    const router = useRouter()
    const [news, setNews] = useState<News[]>([])
    const [characters, setCharacters] = useState<Character[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingCharacters, setLoadingCharacters] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [editingNews, setEditingNews] = useState<News | null>(null)
    const [formTitle, setFormTitle] = useState('')
    const [formContent, setFormContent] = useState('')
    const [formCharacterId, setFormCharacterId] = useState<number | undefined>(undefined)
    const [formIcon, setFormIcon] = useState<string>('📰')

    const availableIcons = ['📰', '📢', '🎉', '⚡', '🎮', '🏆', '⭐', '🔥', '💎', '🎯', '📜', '🛡️', '⚔️', '🔮', '🌟']

    const fetchNews = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
            })
            const response = await api.get<ApiResponse<NewsResponse>>(`/admin/news?${params.toString()}`)
            if (response && response.data) {
                setNews(response.data.news)
                setTotalPages(response.data.pagination.totalPages)
                setTotal(response.data.pagination.total)
            }
        } catch (err: any) {
            if (err.status === 404) {
                router.replace('/not-found')
                return
            }
            setError('Error loading news')
        } finally {
            setLoading(false)
        }
    }, [page, router])

    const fetchCharacters = useCallback(async () => {
        try {
            setLoadingCharacters(true)
            const response = await api.get<CharactersApiResponse>('/characters')
            if (response && response.data) {
                setCharacters(response.data)
            }
        } catch (err: any) {
            console.error('Error fetching characters:', err)
        } finally {
            setLoadingCharacters(false)
        }
    }, [])

    useEffect(() => {
        fetchNews()
        fetchCharacters()
    }, [fetchNews, fetchCharacters])

    const handleCreate = () => {
        setEditingNews(null)
        setFormTitle('')
        setFormContent('')
        setFormCharacterId(undefined)
        setFormIcon('📰')
        setShowCreateModal(true)
        setError('')
        setSuccess('')
    }

    const handleEdit = (newsItem: News) => {
        setEditingNews(newsItem)
        setFormTitle(newsItem.title)
        setFormContent(newsItem.content)
        setFormCharacterId(newsItem.characterId)
        setFormIcon(newsItem.icon || '📰')
        setShowCreateModal(true)
        setError('')
        setSuccess('')
    }

    const handleSave = async () => {
        if (!formTitle.trim()) {
            setError('Title is required')
            return
        }
        if (!formContent.trim()) {
            setError('Content is required')
            return
        }

        setSaving(true)
        setError('')
        setSuccess('')
        try {
            const payload: any = {
                title: formTitle,
                content: formContent,
                icon: formIcon,
            }
            if (formCharacterId) {
                payload.characterId = formCharacterId
            }

            if (editingNews) {
                await api.put<ApiResponse<null>>(`/admin/news/${editingNews.id}`, payload)
                setSuccess('News updated successfully')
            } else {
                await api.post<ApiResponse<{ id: number }>>('/admin/news', payload)
                setSuccess('News created successfully')
            }
            setShowCreateModal(false)
            fetchNews()
        } catch (err: any) {
            if (err.status === 404) {
                router.replace('/not-found')
                return
            }
            setError(err.message || 'Error saving news')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this news?')) {
            return
        }

        try {
            setDeletingId(id)
            await api.delete(`/admin/news/${id}`)
            setNews(news.filter((n) => n.id !== id))
            setSuccess('News deleted successfully')
        } catch (err: any) {
            setError(err.message || 'Error deleting news')
        } finally {
            setDeletingId(null)
        }
    }

    if (loading && news.length === 0) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ffd700] mb-4" />
                <p className="text-[#888]">Loading...</p>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#ffd700] to-[#ffed4e] rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-3xl">📰</span>
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-[#ffd700] mb-2">Manage News</h1>
                                <p className="text-[#888]">Create and manage latest news for the homepage</p>
                            </div>
                        </div>
                        <button
                            onClick={handleCreate}
                            className="px-6 py-3 bg-[#ffd700] hover:bg-[#ffd33d] text-[#0a0a0a] rounded-lg font-bold transition-all"
                        >
                            + Create News
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-900/30 border-2 border-red-600 rounded-lg p-4 mb-6">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="bg-green-900/30 border-2 border-green-600 rounded-lg p-4 mb-4">
                        <p className="text-green-300">{success}</p>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ffd700]"></div>
                        <p className="text-[#888] mt-4">Loading news...</p>
                    </div>
                ) : news.length === 0 ? (
                    <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl text-center py-12">
                        <p className="text-[#888] text-lg">No news found. Create your first news!</p>
                    </div>
                ) : (
                    <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl mb-6">
                        <div className="space-y-4">
                            {news.map((newsItem) => (
                                <div
                                    key={newsItem.id}
                                    className="bg-[#1f1f1f]/80 rounded-lg border border-[#404040]/50 p-5 hover:border-[#ffd700]/60 hover:bg-[#252525]/90 transition-all duration-200 shadow-md"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 flex-wrap mb-2">
                                                <h3 className="text-[#ffd700] font-bold text-lg">{newsItem.title}</h3>
                                                <span className="text-[#888] text-xs">{formatDate(newsItem.createdAt)}</span>
                                                {newsItem.author && (
                                                    <span className="text-[#888] text-xs">by {newsItem.author}</span>
                                                )}
                                            </div>
                                            <div className="text-[#d0d0d0] text-sm leading-relaxed line-clamp-3">
                                                {newsItem.content.replace(/<[^>]*>/g, '').substring(0, 200)}
                                                {newsItem.content.replace(/<[^>]*>/g, '').length > 200 && '...'}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => handleEdit(newsItem)}
                                                className="bg-blue-900/30 hover:bg-blue-900/50 border border-blue-700 text-blue-300 px-4 py-2 rounded-lg transition-all text-sm font-semibold"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(newsItem.id)}
                                                disabled={deletingId === newsItem.id}
                                                className="bg-red-900/30 hover:bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                                            >
                                                {deletingId === newsItem.id ? 'Deleting...' : 'Delete'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-6 mt-6 border-t border-[#404040]">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 bg-[#404040] hover:bg-[#505050] disabled:bg-[#2a2a2a] disabled:text-[#666] disabled:cursor-not-allowed text-white rounded-lg transition-all"
                                >
                                    Previous
                                </button>
                                <span className="px-4 py-2 text-[#e0e0e0]">
                                    Page {page} of {totalPages} ({total} total)
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
                    </div>
                )}

                {/* Create/Edit Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-[#1f1f1f] rounded-xl border-2 border-[#ffd700]/30 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-[#ffd700]">
                                        {editingNews ? 'Edit News' : 'Create News'}
                                    </h2>
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="text-[#888] hover:text-[#e0e0e0] text-2xl"
                                    >
                                        ×
                                    </button>
                                </div>

                                {error && (
                                    <div className="bg-red-900/30 border-2 border-red-600 rounded-lg p-4 mb-4">
                                        <p className="text-red-400">{error}</p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[#e0e0e0] font-semibold mb-2">Title</label>
                                        <input
                                            type="text"
                                            value={formTitle}
                                            onChange={(e) => setFormTitle(e.target.value)}
                                            className="w-full px-4 py-2 bg-[#252525] border border-[#404040] rounded-lg text-[#e0e0e0] focus:outline-none focus:border-[#ffd700]"
                                            placeholder="Enter news title..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[#e0e0e0] font-semibold mb-2">Icon</label>
                                        <div className="flex flex-wrap gap-2">
                                            {availableIcons.map((icon) => (
                                                <button
                                                    key={icon}
                                                    type="button"
                                                    onClick={() => setFormIcon(icon)}
                                                    className={`w-12 h-12 text-2xl rounded-lg border-2 transition-all ${
                                                        formIcon === icon
                                                            ? 'border-[#ffd700] bg-[#ffd700]/20'
                                                            : 'border-[#404040] bg-[#252525] hover:border-[#ffd700]/50'
                                                    }`}
                                                >
                                                    {icon}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[#e0e0e0] font-semibold mb-2">Author Character (Optional)</label>
                                        <select
                                            value={formCharacterId || ''}
                                            onChange={(e) => setFormCharacterId(e.target.value ? parseInt(e.target.value) : undefined)}
                                            className="w-full px-4 py-2 bg-[#252525] border border-[#404040] rounded-lg text-[#e0e0e0] focus:outline-none focus:border-[#ffd700]"
                                        >
                                            <option value="">No character (use account email)</option>
                                            {loadingCharacters ? (
                                                <option disabled>Loading characters...</option>
                                            ) : characters.length === 0 ? (
                                                <option disabled>No characters available</option>
                                            ) : (
                                                characters.map((char) => (
                                                    <option key={char.id} value={char.id}>
                                                        {char.name} ({char.vocation}, Level {char.level})
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                        <p className="text-[#888] text-xs mt-1">Select a character to display as the author. If not selected, the account email will be used.</p>
                                    </div>

                                    <div>
                                        <label className="block text-[#e0e0e0] font-semibold mb-2">Content</label>
                                        <TiptapEditor
                                            value={formContent}
                                            onChange={setFormContent}
                                            placeholder="Enter news content here..."
                                        />
                                    </div>

                                    <div className="flex gap-4 justify-end pt-4">
                                        <button
                                            onClick={() => setShowCreateModal(false)}
                                            className="px-6 py-3 bg-[#404040] hover:bg-[#505050] text-white rounded-lg font-bold transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="px-6 py-3 bg-[#ffd700] hover:bg-[#ffd33d] rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {saving ? 'Saving...' : editingNews ? 'Update' : 'Create'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

