'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { api } from '../../services/api'
import type { ApiResponse } from '../../types/account'
import type { NewsComment } from '../../types/news'
import { formatRelativeTime } from '../../utils/date'
import { makeOutfit } from '../../utils/outfit'
import NotificationCard, { NotificationItem } from './NotificationCard'

interface CommentWithNews extends NewsComment {
  newsTitle: string
}

export default function CommentsNotifications() {
  const [unreadComments, setUnreadComments] = useState<CommentWithNews[]>([])
  const [loading, setLoading] = useState(false)

  const fetchUnreadComments = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get<ApiResponse<CommentWithNews[]>>('/admin/news/comments/unread')
      if (response && response.data) {
        setUnreadComments(response.data)
      }
    } catch (err) {
      console.error('Error fetching unread comments:', err)
      setUnreadComments([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleOpen = useCallback(() => {
    fetchUnreadComments()
  }, [fetchUnreadComments])

  // Fetch periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadComments()
    }, 30000) // Every 30 seconds

    // Initial fetch
    fetchUnreadComments()

    return () => clearInterval(interval)
  }, [fetchUnreadComments])

  const handleMarkAsRead = async (id: number | string) => {
    try {
      await api.post(`/admin/news/comments/${id}/read`)
      setUnreadComments(unreadComments.filter(c => c.id !== id))
    } catch (err) {
      console.error('Error marking comment as read:', err)
      throw err
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true)
      await api.post('/admin/news/comments/read-all')
      setUnreadComments([])
    } catch (err) {
      console.error('Error marking all as read:', err)
      throw err
    } finally {
      setLoading(false)
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

  // Convert comments to notification items
  const notificationItems: NotificationItem[] = unreadComments.map(comment => ({
    id: comment.id,
    title: comment.characterName,
    content: `${comment.newsTitle}\n${comment.content}`,
    link: `/news/${comment.newsId}`,
    timestamp: comment.createdAt,
    metadata: { comment },
  }))

  const renderCommentItem = (item: NotificationItem) => {
    const comment = item.metadata?.comment as CommentWithNews
    if (!comment) return null

    const outfitUrl = getOutfitUrl(comment)

    return (
      <div key={item.id} className="p-4 hover:bg-[#1f1f1f] transition-colors">
        <div className="flex items-start gap-3">
          {/* Character Outfit */}
          <div className="flex-shrink-0">
            {outfitUrl ? (
              <img
                src={outfitUrl}
                alt={comment.characterName}
                className="w-12 h-12 rounded border border-[#404040]/50"
              />
            ) : (
              <div className="w-12 h-12 rounded border border-[#404040]/50 bg-[#0a0a0a] flex items-center justify-center">
                <span className="text-xl">👤</span>
              </div>
            )}
          </div>

          {/* Comment Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1 min-w-0">
                <Link
                  href={`/characters/${comment.characterName}`}
                  className="text-[#ffd700] font-semibold hover:underline text-sm block truncate"
                >
                  {comment.characterName}
                </Link>
                <Link
                  href={`/news/${comment.newsId}`}
                  className="text-[#3b82f6] hover:text-[#60a5fa] hover:underline text-xs block truncate"
                >
                  {comment.newsTitle}
                </Link>
              </div>
            </div>
            <p className="text-[#d0d0d0] text-xs whitespace-pre-wrap line-clamp-2 mb-1">
              {comment.content}
            </p>
            <span className="text-[#888] text-xs">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <NotificationCard
      title="Comments Notifications"
      icon="💬"
      emptyMessage="No new comments"
      items={notificationItems}
      loading={loading}
      onMarkAsRead={handleMarkAsRead}
      onMarkAllAsRead={handleMarkAllAsRead}
      renderItem={renderCommentItem}
      viewAllLink="/admin/comments"
      viewAllLabel="View All Comments"
      onOpen={handleOpen}
    />
  )
}

