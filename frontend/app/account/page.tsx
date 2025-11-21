'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { authService } from '../services/auth'
import { api } from '../services/api'
import type { Character, Ticket, AccountInfo, CharactersApiResponse, AccountApiResponse } from '../types/account'

// Constants moved outside component to avoid recreation
const EMPTY_TICKETS: Ticket[] = []
const EMPTY_NAMELOCKS: any[] = []
const EMPTY_REPORTS: any[] = []

export default function AccountManagementPage() {
    const [user, setUser] = useState<AccountInfo>({
        email: '',
        accountType: 'Free Account',
        premiumDays: 0,
        createdAt: '',
        codexCoins: 0,
        codexCoinsTransferable: 0,
        loyaltyPoints: 0,
    })

    const [characters, setCharacters] = useState<Character[]>([])
    const [loading, setLoading] = useState(true)
    const [userLoading, setUserLoading] = useState(true)
    const [error, setError] = useState('')

    // Fetch account information from API
    const fetchAccountInfo = useCallback(async () => {
        try {
            setUserLoading(true)
            const response = await api.get<AccountApiResponse>('/account')
            if (response && response.data) {
                setUser(response.data)
            }
        } catch (err: any) {
            console.error('Error fetching account info:', err)
            // Set default user on error to prevent UI breakage
            setUser({
                email: 'Error loading account',
                accountType: 'Free Account',
                premiumDays: 0,
                createdAt: '',
                codexCoins: 0,
                codexCoinsTransferable: 0,
                loyaltyPoints: 0,
            })
        } finally {
            setUserLoading(false)
        }
    }, [])

    // Fetch characters from API
    const fetchCharacters = useCallback(async () => {
        try {
            setLoading(true)
            setError('')
            const response = await api.get<CharactersApiResponse>('/characters')
            if (response && response.data && Array.isArray(response.data)) {
                setCharacters(response.data)
            } else {
                setError('Invalid response format')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load characters')
            console.error('Error fetching characters:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchAccountInfo()
        fetchCharacters()
    }, [fetchAccountInfo, fetchCharacters])

    const handleLogout = useCallback(() => {
        authService.logout('/login')
    }, [])

    return (
        <div>
            <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                        <span className="text-[#ffd700]">Account</span>{' '}
                        <span className="text-[#3b82f6]">Management</span>
                    </h1>
                    <p className="text-[#d0d0d0] text-sm">
                        {userLoading ? 'Loading...' : `Welcome to your account, ${user.email || 'user'}!`}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Tickets Section */}
                        <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-[#ffd700]">🎫 Tickets</h2>
                                <Link
                                    href="/support/tickets"
                                    className="bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-bold py-2 px-4 rounded-lg transition-all"
                                >
                                    Create Ticket
                                </Link>
                            </div>
                            {EMPTY_TICKETS.length === 0 ? (
                                <div className="bg-[#1a1a1a] border border-[#404040]/60 rounded-lg p-4 text-[#b0b0b0] text-sm">
                                    There are no tickets.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {EMPTY_TICKETS.map((ticket) => (
                                        <div
                                            key={ticket.id}
                                            className="bg-[#1a1a1a] border border-[#404040]/60 rounded-lg p-4 hover:border-[#505050] transition-all"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-[#e0e0e0] font-medium">{ticket.subject}</h3>
                                                    <p className="text-[#888] text-xs mt-1">{ticket.date}</p>
                                                </div>
                                                <span
                                                    className={`text-xs font-bold px-2 py-1 rounded ${ticket.status === 'open'
                                                        ? 'bg-green-900/30 text-green-400'
                                                        : ticket.status === 'pending'
                                                            ? 'bg-yellow-900/30 text-yellow-400'
                                                            : 'bg-gray-900/30 text-gray-400'
                                                        }`}
                                                >
                                                    {ticket.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Namelocks Section */}
                        <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl">
                            <h2 className="text-xl font-bold text-[#ffd700] mb-4">🔒 Namelocks</h2>
                            {EMPTY_NAMELOCKS.length === 0 ? (
                                <div className="bg-[#1a1a1a] border border-[#404040]/60 rounded-lg p-4 text-[#b0b0b0] text-sm">
                                    There are no pending namelocks.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {EMPTY_NAMELOCKS.map((namelock, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-[#1a1a1a] border border-[#404040]/60 rounded-lg p-4"
                                        >
                                            {namelock.info}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* My Latest Reports Section */}
                        <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl">
                            <h2 className="text-xl font-bold text-[#ffd700] mb-4">📋 My Latest Reports</h2>
                            {EMPTY_REPORTS.length === 0 ? (
                                <div className="bg-[#1a1a1a] border border-[#404040]/60 rounded-lg p-4 text-[#b0b0b0] text-sm">
                                    There are no reports.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {EMPTY_REPORTS.map((report, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-[#1a1a1a] border border-[#404040]/60 rounded-lg p-4"
                                        >
                                            {report.info}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Characters Section */}
                        <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-[#ffd700]">⚔️ Characters</h2>
                                <Link
                                    href="/create-character"
                                    className="bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-bold py-2 px-4 rounded-lg transition-all"
                                >
                                    Create Character
                                </Link>
                            </div>
                            {loading ? (
                                <div className="bg-[#1a1a1a] border border-[#404040]/60 rounded-lg p-4 text-[#b0b0b0] text-sm text-center">
                                    Loading characters...
                                </div>
                            ) : error ? (
                                <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300 text-sm">
                                    {error}
                                </div>
                            ) : characters.length === 0 ? (
                                <div className="bg-[#1a1a1a] border border-[#404040]/60 rounded-lg p-4 text-[#b0b0b0] text-sm text-center">
                                    You don't have any characters yet. Create your first character!
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-[#404040]/60">
                                                <th className="text-left text-[#ffd700] text-sm font-bold py-3 px-2">#</th>
                                                <th className="text-left text-[#ffd700] text-sm font-bold py-3 px-2">Name</th>
                                                <th className="text-left text-[#ffd700] text-sm font-bold py-3 px-2">Vocation</th>
                                                <th className="text-left text-[#ffd700] text-sm font-bold py-3 px-2">Level</th>
                                                <th className="text-left text-[#ffd700] text-sm font-bold py-3 px-2">World</th>
                                                <th className="text-left text-[#ffd700] text-sm font-bold py-3 px-2">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {characters.map((char, idx) => (
                                                <tr
                                                    key={char.id}
                                                    className="border-b border-[#404040]/30 hover:bg-[#1a1a1a]/50 transition-all"
                                                >
                                                    <td className="py-3 px-2 text-[#d0d0d0] text-sm">{idx + 1}</td>
                                                    <td className="py-3 px-2">
                                                        <Link
                                                            href={`/characters/${char.name}`}
                                                            className="text-[#3b82f6] hover:text-[#60a5fa] font-medium text-sm transition-colors"
                                                        >
                                                            {char.name}
                                                        </Link>
                                                    </td>
                                                    <td className="py-3 px-2 text-[#d0d0d0] text-sm">{char.vocation}</td>
                                                    <td className="py-3 px-2 text-[#d0d0d0] text-sm">{char.level}</td>
                                                    <td className="py-3 px-2 text-[#d0d0d0] text-sm">{char.world}</td>
                                                    <td className="py-3 px-2">
                                                        <span
                                                            className={`text-xs font-bold px-2 py-1 rounded ${char.status === 'online'
                                                                ? 'bg-green-900/30 text-green-400'
                                                                : 'bg-gray-900/30 text-gray-400'
                                                                }`}
                                                        >
                                                            {char.status === 'online' ? 'Online' : 'Offline'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Download Client Section */}
                        <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl">
                            <h2 className="text-xl font-bold text-[#ffd700] mb-4">⬇️ Download Client</h2>
                            <div className="bg-[#1a1a1a] border border-[#404040]/60 rounded-lg p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-4xl">💻</span>
                                    <div>
                                        <p className="text-[#e0e0e0] font-medium">CodexAAC Client</p>
                                        <p className="text-[#888] text-xs">Latest version - Windows/Linux/Mac</p>
                                    </div>
                                </div>
                                <Link
                                    href="/download"
                                    className="bg-[#ffd700] hover:bg-[#ffed4e] text-[#0a0a0a] font-bold py-2 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl"
                                >
                                    Download
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Account Status & Actions */}
                    <div className="space-y-6">
                        {/* Account Status */}
                        <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl">
                            <h3 className="text-xl font-bold text-[#ffd700] mb-4">Account Status</h3>

                            <div className="bg-[#1a1a1a] border-2 border-[#404040]/60 rounded-lg p-4 mb-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center border-2 border-red-700">
                                        <span className="text-2xl">👤</span>
                                    </div>
                                    <div>
                                        <h4 className="text-red-400 font-bold">{user.accountType}</h4>
                                        <p className="text-[#888] text-xs">
                                            Premium Time: {user.premiumDays} days
                                        </p>
                                    </div>
                                </div>
                                {user.premiumDays > 0 && (
                                    <p className="text-[#b0b0b0] text-xs">
                                        Your VIP Time expired at {user.vipExpiry}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Link
                                    href="/account/settings"
                                    className="block w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white text-center font-bold py-2.5 px-4 rounded-lg transition-all"
                                >
                                    Manage Account
                                </Link>
                                <Link
                                    href="/shop"
                                    className="block w-full bg-green-700 hover:bg-green-600 text-white text-center font-bold py-2.5 px-4 rounded-lg transition-all"
                                >
                                    Get Premium
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-2.5 px-4 rounded-lg transition-all"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>

                        {/* Account Bonuses */}
                        <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl">
                            <h3 className="text-xl font-bold text-[#ffd700] mb-4">Active Bonuses</h3>

                            <div className="space-y-3">
                                <div className="bg-[#1a1a1a] border border-[#404040]/60 rounded-lg p-3 flex items-center gap-3">
                                    <span className="text-2xl">⚡</span>
                                    <div className="flex-1">
                                        <p className="text-[#e0e0e0] text-sm font-medium">Quick Looting</p>
                                        <p className="text-[#888] text-xs">Customize to your liking</p>
                                    </div>
                                </div>

                                <div className="bg-[#1a1a1a] border border-[#404040]/60 rounded-lg p-3 flex items-center gap-3">
                                    <span className="text-2xl">💀</span>
                                    <div className="flex-1">
                                        <p className="text-[#e0e0e0] text-sm font-medium">Death Protection</p>
                                        <p className="text-[#888] text-xs">Lose 30% less on death</p>
                                    </div>
                                </div>

                                <div className="bg-[#1a1a1a] border border-[#404040]/60 rounded-lg p-3 flex items-center gap-3">
                                    <span className="text-2xl">⭐</span>
                                    <div className="flex-1">
                                        <p className="text-[#e0e0e0] text-sm font-medium">XP Boost</p>
                                        <p className="text-[#888] text-xs">50% XP boost for 3 hours daily</p>
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div>
                </div>

                {/* Back Link */}
                <div className="mt-8 text-center">
                    <Link
                        href="/"
                        className="text-[#d0d0d0] hover:text-[#ffd700] text-sm transition-colors inline-flex items-center gap-2"
                    >
                        <span>←</span>
                        Back to Home
                    </Link>
                </div>
            </main>
        </div>
    )
}
