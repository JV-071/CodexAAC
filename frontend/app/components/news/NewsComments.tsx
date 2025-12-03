'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { formatRelativeTime } from '../../utils/date'
import { makeOutfit } from '../../utils/outfit'
import type { NewsComment } from '../../types/news'
import type { Character, CharactersApiResponse } from '../../types/character'
import type { ApiResponse } from '../../types/account'

interface NewsCommentsProps {
	newsId: number
	isAdmin?: boolean
}

export default function NewsComments({ newsId, isAdmin = false }: NewsCommentsProps) {
	const { isAuthenticated } = useAuth()
	const [comments, setComments] = useState<NewsComment[]>([])
	const [characters, setCharacters] = useState<Character[]>([])
	const [loading, setLoading] = useState(true)
	const [submitting, setSubmitting] = useState(false)
	const [deletingId, setDeletingId] = useState<number | null>(null)
	const [commentContent, setCommentContent] = useState('')
	const [selectedCharacterId, setSelectedCharacterId] = useState<number | undefined>(undefined)
	const [error, setError] = useState('')

	useEffect(() => {
		fetchComments()
		if (isAuthenticated) {
			fetchCharacters()
		}
	}, [newsId, isAuthenticated])

	const fetchComments = async () => {
		try {
			setLoading(true)
			const response = await api.get<ApiResponse<NewsComment[]>>(`/news/${newsId}/comments`, { public: true })
			if (response && response.data) {
				setComments(response.data)
			}
		} catch (err) {
			console.error('Error fetching comments:', err)
			setComments([])
		} finally {
			setLoading(false)
		}
	}

	const fetchCharacters = async () => {
		try {
			const response = await api.get<CharactersApiResponse>('/characters')
			if (response && response.data) {
				setCharacters(response.data)
				if (response.data.length > 0) {
					setSelectedCharacterId(response.data[0].id)
				}
			}
		} catch (err) {
			console.error('Error fetching characters:', err)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!selectedCharacterId || !commentContent.trim()) {
			setError('Please select a character and enter a comment')
			return
		}

		setSubmitting(true)
		setError('')
		try {
			await api.post(`/news/${newsId}/comments`, {
				newsId,
				characterId: selectedCharacterId,
				content: commentContent.trim(),
			})
			setCommentContent('')
			fetchComments()
		} catch (err: any) {
			setError(err.message || 'Error posting comment')
		} finally {
			setSubmitting(false)
		}
	}

	const handleDelete = async (commentId: number) => {
		if (!confirm('Are you sure you want to delete this comment?')) {
			return
		}

		try {
			setDeletingId(commentId)
			await api.delete(`/news/comments/${commentId}`)
			setComments(comments.filter((c) => c.id !== commentId))
		} catch (err: any) {
			setError(err.message || 'Error deleting comment')
		} finally {
			setDeletingId(null)
		}
	}

	const getOutfitUrl = (comment: NewsComment) => {
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

	return (
		<div>
			<h4 className="text-[#ffd700] font-bold text-lg mb-4">Comments ({comments.length})</h4>

			{/* Comments List */}
			{loading ? (
				<div className="text-center py-4">
					<div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#ffd700]"></div>
				</div>
			) : comments.length === 0 ? (
				<p className="text-[#888] text-sm text-center py-4">No comments yet. Be the first to comment!</p>
			) : (
				<div className="space-y-4 mb-6">
					{comments.map((comment) => {
						const outfitUrl = getOutfitUrl(comment)
						return (
							<div key={comment.id} className="bg-[#1a1a1a]/60 rounded-lg p-4 border border-[#404040]/30">
								<div className="flex items-start gap-3">
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
										<div className="flex items-center gap-2 mb-1">
											<Link
												href={`/characters/${comment.characterName}`}
												className="text-[#ffd700] font-semibold hover:underline text-sm"
											>
												{comment.characterName}
											</Link>
											<span className="text-[#888] text-xs">{formatRelativeTime(comment.createdAt)}</span>
											{isAdmin && (
												<button
													onClick={() => handleDelete(comment.id)}
													disabled={deletingId === comment.id}
													className="ml-auto text-red-400 hover:text-red-300 text-xs disabled:opacity-50"
												>
													{deletingId === comment.id ? 'Deleting...' : 'Delete'}
												</button>
											)}
										</div>
										<p className="text-[#d0d0d0] text-sm whitespace-pre-wrap">{comment.content}</p>
									</div>
								</div>
							</div>
						)
					})}
				</div>
			)}

			{/* Comment Form */}
			{isAuthenticated && (
				<form onSubmit={handleSubmit} className="space-y-3">
					{error && (
						<div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
							<p className="text-red-300 text-sm">{error}</p>
						</div>
					)}

					<div>
						<label className="block text-[#e0e0e0] text-sm font-semibold mb-2">Comment as:</label>
						<select
							value={selectedCharacterId || ''}
							onChange={(e) => setSelectedCharacterId(e.target.value ? parseInt(e.target.value) : undefined)}
							className="w-full px-4 py-2 bg-[#252525] border border-[#404040] rounded-lg text-[#e0e0e0] focus:outline-none focus:border-[#ffd700] text-sm"
						>
							{characters.length === 0 ? (
								<option disabled>No characters available</option>
							) : (
								characters.map((char) => (
									<option key={char.id} value={char.id}>
										{char.name} ({char.vocation}, Level {char.level})
									</option>
								))
							)}
						</select>
					</div>

					<div>
						<textarea
							value={commentContent}
							onChange={(e) => setCommentContent(e.target.value)}
							placeholder="Write a comment..."
							rows={3}
							className="w-full px-4 py-2 bg-[#252525] border border-[#404040] rounded-lg text-[#e0e0e0] focus:outline-none focus:border-[#ffd700] text-sm resize-none"
						/>
					</div>

					<button
						type="submit"
						disabled={submitting || !selectedCharacterId || !commentContent.trim()}
						className="px-4 py-2 bg-[#ffd700] hover:bg-[#ffd33d] text-[#0a0a0a] rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
					>
						{submitting ? 'Posting...' : 'Post Comment'}
					</button>
				</form>
			)}

			{!isAuthenticated && (
				<p className="text-[#888] text-sm text-center py-4">
					<Link href="/login" className="text-[#ffd700] hover:underline">
						Login
					</Link>{' '}
					to post a comment
				</p>
			)}
		</div>
	)
}

