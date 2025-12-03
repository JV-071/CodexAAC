'use client'

import { useState, useEffect, useRef, ReactNode } from 'react'
import Link from 'next/link'

export interface NotificationItem {
  id: number | string
  title: string
  content: string
  link?: string
  timestamp: number
  icon?: string
  metadata?: Record<string, any>
}

export interface NotificationCardProps {
  title: string
  icon: string
  emptyMessage?: string
  items: NotificationItem[]
  loading?: boolean
  onMarkAsRead?: (id: number | string) => Promise<void>
  onMarkAllAsRead?: () => Promise<void>
  renderItem?: (item: NotificationItem, onMarkAsRead?: (id: number | string) => Promise<void>) => ReactNode
  viewAllLink?: string
  viewAllLabel?: string
  onOpen?: () => void
}

export default function NotificationCard({
  title,
  icon,
  emptyMessage = 'No new notifications',
  items,
  loading = false,
  onMarkAsRead,
  onMarkAllAsRead,
  renderItem,
  viewAllLink,
  viewAllLabel = 'View All',
  onOpen,
}: NotificationCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [markingAsRead, setMarkingAsRead] = useState<number | string | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  const handleToggle = () => {
    const newIsOpen = !isOpen
    setIsOpen(newIsOpen)
    if (newIsOpen && onOpen) {
      onOpen()
    }
  }

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleMarkAsRead = async (id: number | string) => {
    if (!onMarkAsRead) return
    try {
      setMarkingAsRead(id)
      await onMarkAsRead(id)
    } catch (err) {
      console.error('Error marking notification as read:', err)
    } finally {
      setMarkingAsRead(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!onMarkAllAsRead) return
    try {
      await onMarkAllAsRead()
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  const unreadCount = items.length

  const defaultRenderItem = (item: NotificationItem) => (
    <div key={item.id} className="p-4 hover:bg-[#1f1f1f] transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {item.link ? (
            <Link
              href={item.link}
              onClick={() => setIsOpen(false)}
              className="text-[#ffd700] font-semibold hover:underline text-sm block truncate mb-1"
            >
              {item.title}
            </Link>
          ) : (
            <h4 className="text-[#ffd700] font-semibold text-sm mb-1">{item.title}</h4>
          )}
          <p className="text-[#d0d0d0] text-xs whitespace-pre-wrap line-clamp-2 mb-1">
            {item.content}
          </p>
          <span className="text-[#888] text-xs">
            {new Date(item.timestamp * 1000).toLocaleString()}
          </span>
        </div>
        {onMarkAsRead && (
          <button
            onClick={() => handleMarkAsRead(item.id)}
            disabled={markingAsRead === item.id}
            className="flex-shrink-0 px-2 py-1 bg-green-900/30 hover:bg-green-900/50 border border-green-700 text-green-300 rounded text-xs font-semibold disabled:opacity-50"
            title="Mark as read"
          >
            {markingAsRead === item.id ? '...' : '✓'}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="relative" ref={popupRef}>
      {/* Notification Card/Button */}
      <button
        onClick={handleToggle}
        className="relative w-full bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl hover:border-[#ffd700]/50 transition-all text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#ffd700] to-[#ffed4e] rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-2xl">{icon}</span>
            </div>
            <div>
              <h3 className="text-[#ffd700] font-bold text-lg mb-1">{title}</h3>
              <p className="text-[#888] text-sm">
                {unreadCount === 0
                  ? emptyMessage
                  : `${unreadCount} new notification${unreadCount !== 1 ? 's' : ''}`
                }
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </button>

      {/* Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full sm:w-96 bg-[#252525] border-2 border-[#ffd700]/30 rounded-lg shadow-xl z-50 max-h-[600px] flex flex-col" style={{ maxWidth: 'calc(100vw - 2rem)' }}>
          {/* Header */}
          <div className="p-4 border-b border-[#404040]/50 flex items-center justify-between">
            <h3 className="text-[#ffd700] font-bold text-lg">{title}</h3>
            {unreadCount > 0 && onMarkAllAsRead && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="px-3 py-1 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-700 text-blue-300 rounded text-xs font-semibold disabled:opacity-50"
              >
                {loading ? 'Marking...' : 'Mark All Read'}
              </button>
            )}
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1">
            {loading && items.length === 0 ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#ffd700]"></div>
                <p className="text-[#888] mt-2 text-sm">Loading...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-[#888] text-sm">{emptyMessage}</p>
              </div>
            ) : (
              <div className="divide-y divide-[#404040]/30">
                {items.map((item) =>
                  renderItem ? renderItem(item, onMarkAsRead ? () => handleMarkAsRead(item.id) : undefined) : defaultRenderItem(item)
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {unreadCount > 0 && viewAllLink && (
            <div className="p-3 border-t border-[#404040]/50 text-center">
              <Link
                href={viewAllLink}
                onClick={() => setIsOpen(false)}
                className="text-[#ffd700] hover:text-[#ffd33d] text-sm font-semibold hover:underline"
              >
                {viewAllLabel} →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

