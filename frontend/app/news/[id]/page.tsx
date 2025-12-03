'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { formatRelativeTime, formatDate } from '../../utils/date'
import type { News, SingleNewsApiResponse } from '../../types/news'
import type { ApiResponse } from '../../types/account'
import NewsComments from '../../components/news/NewsComments'
import TiptapEditor from '../../components/admin/TiptapEditor'

export default function NewsPage() {
	const params = useParams()
	const router = useRouter()
	const { isAuthenticated } = useAuth()
	const newsId = params?.id ? parseInt(params.id as string) : null

	const [news, setNews] = useState<News | null>(null)
	const [loading, setLoading] = useState(true)
	const [isAdmin, setIsAdmin] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const [editTitle, setEditTitle] = useState('')
	const [editContent, setEditContent] = useState('')
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		if (!newsId || isNaN(newsId)) {
			router.push('/')
			return
		}
		fetchNews()
		if (isAuthenticated) {
			checkAdmin()
		}
	}, [newsId, isAuthenticated, router])

	const checkAdmin = async () => {
		try {
			await api.get('/admin/stats')
			setIsAdmin(true)
		} catch {
			setIsAdmin(false)
		}
	}

	const fetchNews = async () => {
		if (!newsId) return

		try {
			setLoading(true)
			const response = await api.get<SingleNewsApiResponse>(`/news/${newsId}`, { public: true })
			if (response && response.data) {
				setNews(response.data)
				setEditTitle(response.data.title)
				setEditContent(response.data.content)
			}
		} catch (err: any) {
			console.error('Error fetching news:', err)
			if (err.status === 404) {
				router.push('/')
			}
		} finally {
			setLoading(false)
		}
	}

	const handleEdit = () => {
		if (news) {
			setIsEditing(true)
			setEditTitle(news.title)
			setEditContent(news.content)
		}
	}

	const handleCancelEdit = () => {
		setIsEditing(false)
		if (news) {
			setEditTitle(news.title)
			setEditContent(news.content)
		}
	}

	const handleSaveEdit = async () => {
		if (!newsId || !editTitle.trim() || !editContent.trim()) {
			return
		}

		setSaving(true)
		try {
			await api.put(`/admin/news/${newsId}`, {
				title: editTitle,
				content: editContent,
			})
			setIsEditing(false)
			fetchNews()
		} catch (err) {
			console.error('Error updating news:', err)
		} finally {
			setSaving(false)
		}
	}

	if (loading) {
		return (
			<main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border border-[#404040]/60 p-8 shadow-xl">
					<div className="text-center py-12">
						<div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ffd700]"></div>
						<p className="text-[#888] mt-4">Loading news...</p>
					</div>
				</div>
			</main>
		)
	}

	if (!news) {
		return (
			<main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border border-[#404040]/60 p-8 shadow-xl">
					<div className="text-center py-12">
						<p className="text-[#888] text-lg">News not found</p>
						<Link
							href="/"
							className="mt-4 inline-block text-[#ffd700] hover:text-[#ffd33d] hover:underline"
						>
							← Back to Home
						</Link>
					</div>
				</div>
			</main>
		)
	}

	const icon = news.icon || '📰'

	return (
		<main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
			{/* Back Button */}
			<div className="mb-6">
				<Link
					href="/"
					className="inline-flex items-center gap-2 text-[#ffd700] hover:text-[#ffd33d] hover:underline"
				>
					← Back to Home
				</Link>
			</div>

			{/* News Card */}
			<div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border border-[#404040]/60 p-6 sm:p-8 shadow-xl">
				{/* Header */}
				<div className="flex items-start justify-between gap-4 mb-6 pb-6 border-b border-[#404040]/50">
					<div className="flex items-start gap-4 flex-1">
						{/* Icon */}
						<div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-[#404040]/50 bg-gradient-to-br from-[#ffd700]/20 to-[#ffd700]/10 relative flex items-center justify-center">
							<div className="text-3xl sm:text-4xl">{icon}</div>
						</div>

						{/* Title and Meta */}
						<div className="flex-1 min-w-0">
							{isEditing ? (
								<input
									type="text"
									value={editTitle}
									onChange={(e) => setEditTitle(e.target.value)}
									className="w-full px-4 py-3 bg-[#252525] border border-[#404040] rounded-lg text-[#e0e0e0] focus:outline-none focus:border-[#ffd700] mb-3 text-xl font-bold"
								/>
							) : (
								<h1 className="text-[#ffd700] font-bold text-2xl sm:text-3xl mb-3">{news.title}</h1>
							)}
							<div className="flex items-center gap-3 flex-wrap text-sm text-[#888]">
								<span>{formatDate(news.createdAt)}</span>
								{news.author && (
									<>
										<span>•</span>
										<Link
											href={`/characters/${news.author}`}
											className="text-[#d0d0d0] hover:text-[#ffd700] hover:underline"
										>
											by {news.author}
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
								onClick={handleEdit}
								className="px-4 py-2 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-700 text-blue-300 rounded text-sm font-semibold"
							>
								Edit
							</button>
						</div>
					)}

					{isEditing && (
						<div className="flex gap-2">
							<button
								onClick={handleSaveEdit}
								disabled={saving}
								className="px-4 py-2 bg-green-900/30 hover:bg-green-900/50 border border-green-700 text-green-300 rounded text-sm font-semibold disabled:opacity-50"
							>
								{saving ? 'Saving...' : 'Save'}
							</button>
							<button
								onClick={handleCancelEdit}
								className="px-4 py-2 bg-gray-900/30 hover:bg-gray-900/50 border border-gray-700 text-gray-300 rounded text-sm font-semibold"
							>
								Cancel
							</button>
						</div>
					)}
				</div>

				{/* Content */}
				{isEditing ? (
					<div className="mb-8">
						<TiptapEditor
							value={editContent}
							onChange={setEditContent}
							placeholder="Enter news content here..."
						/>
					</div>
				) : (
					<div
						className="news-content text-[#d0d0d0] text-base sm:text-lg leading-relaxed mb-8"
						dangerouslySetInnerHTML={{ __html: news.content }}
					/>
				)}

				{/* Comments Section */}
				<div className="mt-8 pt-8 border-t border-[#404040]/50">
					<NewsComments newsId={news.id} isAdmin={isAdmin} />
				</div>
			</div>
		</main>
	)
}

