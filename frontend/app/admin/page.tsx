'use client'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../services/api'
import type { AdminStats, AdminAccountsResponse, AdminAccount } from '../types/admin'
import type { ApiResponse } from '../types/account'

// Constants moved outside component to avoid recreation
const SKELETON_CARDS = Array.from({ length: 4 }, (_, i) => i) // 4 cards: Total Accounts, Pending Deletion, Online Characters, Total Characters
const ACCOUNTS_PER_PAGE = 50

const handleAdminError = (err: any, router: { replace: (path: string) => void }): boolean => {
    const status = err.status || err.response?.status
    
    if (status === 404) {
        router.replace('/not-found')
        return true
    }
    return false
}

// Memoized StatCard component to avoid re-renders
const StatCard = memo(({ title, value, icon, color }: { title: string; value: number | string; icon: string; color: string }) => (
    <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl hover:border-[#ffd700]/50 transition-all">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#888] text-sm font-semibold uppercase tracking-wide">{title}</h3>
            <span className="text-3xl">{icon}</span>
        </div>
        <p className={`text-3xl font-bold ${color}`}>{value.toLocaleString()}</p>
    </div>
))
StatCard.displayName = 'StatCard'

// Memoized AccountRow component to avoid re-renders
const AccountRow = memo(({ account }: { account: AdminAccount }) => (
    <tr className="border-b border-[#404040]/50 hover:bg-[#1a1a1a]/50 transition-colors">
        <td className="py-4 px-4 text-[#e0e0e0]">
            <span className="font-mono text-sm">{account.id}</span>
            {account.isAdmin && (
                <span className="ml-2 px-2 py-1 bg-[#ffd700] text-[#0a0a0a] text-xs font-bold rounded">
                    ADMIN
                </span>
            )}
        </td>
        <td className="py-4 px-4 text-[#e0e0e0]">{account.email}</td>
        <td className="py-4 px-4">
            <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    account.accountType === 'Premium Account'
                        ? 'bg-green-900/30 text-green-400 border border-green-600'
                        : 'bg-red-900/30 text-red-400 border border-red-600'
                }`}
            >
                {account.accountType}
            </span>
        </td>
        <td className="py-4 px-4 text-[#e0e0e0]">
            {account.premiumDays > 0 ? (
                <span className="text-yellow-400 font-semibold">
                    {account.premiumDays} days
                </span>
            ) : (
                <span className="text-[#888]">-</span>
            )}
        </td>
        <td className="py-4 px-4 text-[#e0e0e0]">
            <span className="text-[#ffd700] font-semibold">
                {account.coins.toLocaleString()}
            </span>
        </td>
        <td className="py-4 px-4 text-[#e0e0e0]">{account.charactersCount}</td>
        <td className="py-4 px-4">
            <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    account.status === 'active'
                        ? 'bg-green-900/30 text-green-400 border border-green-600'
                        : account.status === 'pending_deletion'
                        ? 'bg-red-900/30 text-red-400 border border-red-600'
                        : 'bg-yellow-900/30 text-yellow-400 border border-yellow-600'
                }`}
            >
                {account.status === 'active' 
                    ? 'Active' 
                    : account.status === 'pending_deletion' 
                    ? 'Pending Deletion' 
                    : account.status}
            </span>
        </td>
        <td className="py-4 px-4 text-[#888] text-sm">{account.createdAt}</td>
    </tr>
))
AccountRow.displayName = 'AccountRow'

// Memoized StatsGrid to avoid re-renders when other state changes
const StatsGrid = memo(({ stats }: { stats: AdminStats }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Accounts" value={stats.totalAccounts} icon="👥" color="text-blue-400" />
        <StatCard title="Pending Deletion" value={stats.pendingDeletion} icon="⚠️" color="text-red-400" />
        <StatCard title="Online Characters" value={stats.onlineCharacters} icon="🟢" color="text-emerald-400" />
        <StatCard title="Total Characters" value={stats.totalCharacters} icon="🎮" color="text-purple-400" />
    </div>
))
StatsGrid.displayName = 'StatsGrid'

export default function AdminPage() {
    const router = useRouter()
    const [stats, setStats] = useState<AdminStats | null>(null)
    const [accounts, setAccounts] = useState<AdminAccount[]>([])
    const [loading, setLoading] = useState(true)
    const [accountsLoading, setAccountsLoading] = useState(false)
    const [error, setError] = useState('')
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 1,
    })

    useEffect(() => {
        const checkAdminAccess = async () => {
            try {
                const response = await api.get<ApiResponse<AdminStats>>('/admin/stats')
                if (response && response.data) {
                    setIsAuthorized(true)
                    setStats(response.data)
                }
            } catch (err: any) {
                if (handleAdminError(err, router)) {
                    return
                }
                setIsAuthorized(false)
                setError('Error checking access')
            } finally {
                setLoading(false)
            }
        }
        checkAdminAccess()
    }, [router])

    const fetchAccounts = useCallback(async () => {
        try {
            setAccountsLoading(true)
            setError('') // Clear previous errors
            const params = new URLSearchParams({
                page: page.toString(),
                limit: ACCOUNTS_PER_PAGE.toString(),
            })
            if (search.trim()) {
                params.append('search', search.trim())
            }

            const response = await api.get<ApiResponse<AdminAccountsResponse>>(
                `/admin/accounts?${params.toString()}`
            )
            if (response && response.data) {
                setAccounts(response.data.accounts)
                setPagination(response.data.pagination)
            }
        } catch (err: any) {
            console.error('Error fetching accounts:', err)
            if (handleAdminError(err, router)) {
                return
            }
            setError('Error loading accounts')
        } finally {
            setAccountsLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, search]) // Removed router from deps - handleAdminError uses it but doesn't need to trigger re-fetch

    useEffect(() => {
        if (isAuthorized === true) {
            fetchAccounts()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthorized, page, search])

    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault()
        setPage(1)
    }, [])

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage)
    }, [])

    const paginationInfo = useMemo(() => {
        if (!pagination.total) return null
        const start = ((page - 1) * pagination.limit) + 1
        const end = Math.min(page * pagination.limit, pagination.total)
        return { start, end, total: pagination.total }
    }, [page, pagination])

    const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value)
    }, [])

    if (isAuthorized === false) {
        return null
    }

    if (isAuthorized === null || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ffd700] mb-4"></div>
                    <p className="text-[#888]">Checking access...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#ffd700] to-[#ffed4e] rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-3xl">⚡</span>
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-[#ffd700] mb-2">Admin Panel</h1>
                            <p className="text-[#888]">Complete server management</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-900/30 border-2 border-red-600 rounded-lg p-4 mb-6">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {/* Statistics Cards */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {SKELETON_CARDS.map((i) => (
                            <div key={i} className="bg-[#252525]/95 rounded-xl p-6 animate-pulse">
                                <div className="h-4 bg-[#404040] rounded w-1/2 mb-4"></div>
                                <div className="h-8 bg-[#404040] rounded w-3/4"></div>
                            </div>
                        ))}
                    </div>
                ) : stats ? (
                    <StatsGrid stats={stats} />
                ) : null}

                {/* Accounts Table */}
                <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                        <h2 className="text-2xl font-bold text-[#ffd700]">Manage Accounts</h2>
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <input
                                type="text"
                                value={search}
                                onChange={handleSearchInputChange}
                                placeholder="Search by email..."
                                className="flex-1 bg-[#1a1a1a] border-2 border-[#404040] rounded-lg px-4 py-2 text-[#e0e0e0] focus:outline-none focus:border-[#ffd700] transition-all"
                            />
                            <button
                                type="submit"
                                className="bg-[#ffd700] hover:bg-[#ffed4e] text-[#0a0a0a] font-bold px-6 py-2 rounded-lg transition-all"
                            >
                                Search
                            </button>
                        </form>
                    </div>

                    {accountsLoading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ffd700]"></div>
                            <p className="text-[#888] mt-4">Loading accounts...</p>
                        </div>
                    ) : accounts.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-[#888] text-lg">No accounts found</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-2 border-[#404040]">
                                            <th className="text-left py-4 px-4 text-[#ffd700] font-semibold">ID</th>
                                            <th className="text-left py-4 px-4 text-[#ffd700] font-semibold">Email</th>
                                            <th className="text-left py-4 px-4 text-[#ffd700] font-semibold">Type</th>
                                            <th className="text-left py-4 px-4 text-[#ffd700] font-semibold">Premium</th>
                                            <th className="text-left py-4 px-4 text-[#ffd700] font-semibold">Coins</th>
                                            <th className="text-left py-4 px-4 text-[#ffd700] font-semibold">Characters</th>
                                            <th className="text-left py-4 px-4 text-[#ffd700] font-semibold">Status</th>
                                            <th className="text-left py-4 px-4 text-[#ffd700] font-semibold">Created At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {accounts.map((account) => (
                                            <AccountRow key={account.id} account={account} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between mt-6 pt-6 border-t border-[#404040]">
                                    {paginationInfo && (
                                        <p className="text-[#888] text-sm">
                                            Showing {paginationInfo.start} - {paginationInfo.end} of {paginationInfo.total}
                                        </p>
                                    )}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handlePageChange(Math.max(1, page - 1))}
                                            disabled={page === 1}
                                            className="px-4 py-2 bg-[#404040] hover:bg-[#505050] disabled:bg-[#2a2a2a] disabled:text-[#666] disabled:cursor-not-allowed text-white rounded-lg transition-all"
                                        >
                                            Previous
                                        </button>
                                        <span className="px-4 py-2 text-[#e0e0e0] flex items-center">
                                            Page {page} of {pagination.totalPages}
                                        </span>
                                        <button
                                            onClick={() => handlePageChange(Math.min(pagination.totalPages, page + 1))}
                                            disabled={page === pagination.totalPages}
                                            className="px-4 py-2 bg-[#404040] hover:bg-[#505050] disabled:bg-[#2a2a2a] disabled:text-[#666] disabled:cursor-not-allowed text-white rounded-lg transition-all"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

