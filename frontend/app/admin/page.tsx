'use client'

import { useState, useEffect, memo } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../services/api'
import CreateChangelogSection from '../components/admin/CreateChangelogSection'
import ManageChangelogs from '../components/admin/ManageChangelogs'
import type { AdminStats } from '../types/admin'
import type { ApiResponse } from '../types/account'

// Constants moved outside component to avoid recreation
const SKELETON_CARDS = Array.from({ length: 4 }, (_, i) => i) // 4 cards: Total Accounts, Pending Deletion, Online Characters, Total Characters

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
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

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

                {/* Create Changelog Section */}
                <CreateChangelogSection onSuccess={() => {
                  window.dispatchEvent(new CustomEvent('changelog-created'))
                }} />

                {/* Manage Changelogs Section */}
                <ManageChangelogs />
            </div>
        </div>
    )
}

