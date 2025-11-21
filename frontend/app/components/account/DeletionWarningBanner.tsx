'use client'

import { memo } from 'react'

interface DeletionWarningBannerProps {
    timeRemaining: number | null
    onCancel: () => void
    isCanceling: boolean
}

const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return '0 days'
    const SECONDS_PER_DAY = 86400
    const SECONDS_PER_HOUR = 3600
    const SECONDS_PER_MINUTE = 60
    
    const days = Math.floor(seconds / SECONDS_PER_DAY)
    const hours = Math.floor((seconds % SECONDS_PER_DAY) / SECONDS_PER_HOUR)
    const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE)
    
    if (days > 0) return `${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
}

function DeletionWarningBanner({
    timeRemaining,
    onCancel,
    isCanceling,
}: DeletionWarningBannerProps) {
    return (
        <div className="bg-red-900/30 border-2 border-red-600 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2">
                        <span>⚠️</span>
                        <span>Account Scheduled for Deletion</span>
                    </h3>
                    <p className="text-[#e0e0e0] text-sm mb-2">
                        Your account will be permanently deleted in:{' '}
                        <strong className="text-red-400">
                            {timeRemaining !== null ? formatTimeRemaining(timeRemaining) : 'Calculating...'}
                        </strong>
                    </p>
                    <p className="text-[#888] text-xs">
                        All characters, items, coins and data will be permanently lost.
                    </p>
                </div>
                <button
                    onClick={onCancel}
                    disabled={isCanceling}
                    className="bg-green-700 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-lg transition-all whitespace-nowrap ml-4"
                >
                    {isCanceling ? 'Canceling...' : 'Cancel Deletion'}
                </button>
            </div>
        </div>
    )
}

export default memo(DeletionWarningBanner)

