'use client'

import { memo } from 'react'

interface CancelDeletionModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => Promise<void>
    isCanceling: boolean
}

function CancelDeletionModal({
    isOpen,
    onClose,
    onConfirm,
    isCanceling,
}: CancelDeletionModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] border-2 border-green-600 rounded-lg p-6 max-w-md w-full shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">✅</span>
                    <h3 className="text-green-400 font-bold text-xl">Cancel Account Deletion</h3>
                </div>

                <div className="space-y-4 mb-6">
                    <p className="text-[#e0e0e0]">
                        Are you sure you want to cancel the account deletion? Your account will remain active and the deletion will be canceled.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onConfirm}
                        disabled={isCanceling}
                        className="flex-1 bg-green-700 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all"
                    >
                        {isCanceling ? 'Canceling...' : 'Yes, Cancel Deletion'}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isCanceling}
                        className="flex-1 bg-[#404040] hover:bg-[#505050] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all"
                    >
                        No, Keep Scheduled
                    </button>
                </div>
            </div>
        </div>
    )
}

export default memo(CancelDeletionModal)

