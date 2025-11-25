'use client'

import { useState, useCallback, memo } from 'react'

interface DeleteAccountModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (password: string) => Promise<void>
    isDeleting: boolean
}

function DeleteAccountModal({
    isOpen,
    onClose,
    onConfirm,
    isDeleting,
}: DeleteAccountModalProps) {
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = useCallback(async () => {
        if (!password) {
            setError('Please enter your password to confirm')
            return
        }

        setError('')
        try {
            await onConfirm(password)
            setPassword('')
            setError('')
        } catch (err: any) {
            setError(err.message || 'Invalid password')
        }
    }, [password, onConfirm])

    const handleClose = useCallback(() => {
        setPassword('')
        setError('')
        onClose()
    }, [onClose])

    const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value
        setPassword(newPassword)
        if (error) {
            setError('')
        }
    }, [error])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] border-2 border-red-600 rounded-lg p-6 max-w-md w-full shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">⚠️</span>
                    <h3 className="text-red-400 font-bold text-xl">Confirm Account Deletion</h3>
                </div>

                <div className="space-y-4 mb-6">
                    <p className="text-[#e0e0e0]">
                        This action is <strong className="text-red-400">IRREVERSIBLE</strong>! Your account will be scheduled for permanent deletion in <strong>30 days</strong>.
                    </p>

                    <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-4">
                        <p className="text-[#ffd700] font-bold text-sm mb-2">What will be lost:</p>
                        <ul className="text-[#d0d0d0] text-sm space-y-1 list-disc list-inside">
                            <li>All characters and their levels</li>
                            <li>All items and equipment</li>
                            <li>All Codex Coins</li>
                            <li>Purchase and transaction history</li>
                            <li>All account data</li>
                        </ul>
                    </div>

                    <div>
                        <label className="text-[#ffd700] text-sm font-bold block mb-2">
                            Enter your password to confirm:
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={handlePasswordChange}
                            placeholder="Your password"
                            className={`w-full bg-[#0a0a0a] border-2 rounded-lg px-4 py-2 text-[#e0e0e0] focus:outline-none focus:ring-2 transition-all ${
                                error
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                    : 'border-[#404040] focus:border-red-500 focus:ring-red-500/20'
                            }`}
                            autoFocus
                            disabled={isDeleting}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && password && !isDeleting) {
                                    handleSubmit()
                                }
                            }}
                        />
                        {error && (
                            <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                                <span>⚠️</span>
                                <span>{error}</span>
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleSubmit}
                        disabled={!password || isDeleting}
                        className="flex-1 bg-red-700 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all"
                    >
                        {isDeleting ? 'Scheduling...' : 'Confirm Deletion'}
                    </button>
                    <button
                        onClick={handleClose}
                        disabled={isDeleting}
                        className="flex-1 bg-[#404040] hover:bg-[#505050] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}

export default memo(DeleteAccountModal)

