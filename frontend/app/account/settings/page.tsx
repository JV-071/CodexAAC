'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { api } from '../../services/api'
import type { AccountInfo, AccountApiResponse } from '../../types/account'

type TabType = 'general' | 'products' | 'history' | '2fa'

export default function AccountSettingsPage() {
    const [activeTab, setActiveTab] = useState<TabType>('general')
    const [userData, setUserData] = useState<AccountInfo>({
        email: '',
        accountType: 'Free Account',
        premiumDays: 0,
        createdAt: '',
        codexCoins: 0,
        codexCoinsTransferable: 0,
        loyaltyPoints: 0,
    })
    const [loading, setLoading] = useState(true)

    // Fetch account information from API
    const fetchAccountInfo = useCallback(async () => {
        try {
            setLoading(true)
            const response = await api.get<AccountApiResponse>('/account')
            if (response && response.data) {
                setUserData(response.data)
            }
        } catch (err: any) {
            console.error('Error fetching account info:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchAccountInfo()
    }, [fetchAccountInfo])

    const tabs = [
        { id: 'general' as TabType, label: 'General Information' },
        { id: 'products' as TabType, label: 'Products Available' },
        { id: 'history' as TabType, label: 'History' },
        { id: '2fa' as TabType, label: 'Two-Factor Authentication' },
    ]

    return (
        <div>
            <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                        <span className="text-[#ffd700]">Account</span>{' '}
                        <span className="text-[#3b82f6]">Management</span>
                    </h1>
                </div>

                {/* Top Action Buttons */}
                <div className="flex justify-end gap-3 mb-6">
                    <Link
                        href="/shop"
                        className="bg-green-700 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition-all"
                    >
                        Get Premium
                    </Link>
                    <Link
                        href="/account"
                        className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold py-2 px-6 rounded-lg transition-all"
                    >
                        Overview
                    </Link>
                </div>

                {/* Tabs Navigation */}
                <div className="bg-[#252525]/95 backdrop-blur-sm rounded-t-xl border-2 border-b-0 border-[#505050]/70 p-4">
                    <div className="flex flex-wrap gap-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === tab.id
                                    ? 'bg-[#3b82f6] text-white'
                                    : 'bg-[#1a1a1a] text-[#d0d0d0] hover:bg-[#2a2a2a]'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="bg-[#252525]/95 backdrop-blur-sm rounded-b-xl border-2 border-[#505050]/70 p-6 shadow-2xl">
                    {/* General Information Tab */}
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-[#ffd700] mb-4">General Information</h2>

                            <div className="bg-[#1a1a1a] border border-[#404040]/60 rounded-lg p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="text-[#ffd700] text-sm font-bold block mb-1">Email Address:</label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#e0e0e0]">{loading ? 'Loading...' : userData.email}</span>
                                            {!loading && userData.email && (
                                                <span className="bg-green-700 text-white text-xs px-2 py-0.5 rounded">✓</span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[#ffd700] text-sm font-bold block mb-1">Created:</label>
                                        <span className="text-[#e0e0e0]">{loading ? 'Loading...' : userData.createdAt}</span>
                                    </div>
                                    <div>
                                        <label className="text-[#ffd700] text-sm font-bold block mb-1">Last Login (Website):</label>
                                        <span className="text-[#e0e0e0]">
                                            {loading ? 'Loading...' : (userData.lastLogin || 'Never')}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="text-[#ffd700] text-sm font-bold block mb-1">Account Status:</label>
                                        <div>
                                            <span className={`font-bold ${userData.premiumDays > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {loading ? 'Loading...' : userData.accountType}
                                            </span>
                                            {!loading && userData.vipExpiry && (
                                                <p className="text-[#888] text-xs">
                                                    (Premium Time expired at {userData.vipExpiry}, balance: {userData.premiumDays} days)
                                                </p>
                                            )}
                                            {!loading && !userData.vipExpiry && userData.premiumDays === 0 && (
                                                <p className="text-[#888] text-xs">
                                                    (No premium time, balance: 0 days)
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[#ffd700] text-sm font-bold block mb-1">Codex Coins:</label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#e0e0e0]">{loading ? 'Loading...' : userData.codexCoins}</span>
                                            <span className="text-2xl">🪙</span>
                                            <span className="text-[#888] text-xs">(Including: {loading ? '...' : userData.codexCoinsTransferable} 💎)</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[#ffd700] text-sm font-bold block mb-1">Loyalty Points:</label>
                                        <span className="text-[#e0e0e0]">{loading ? 'Loading...' : userData.loyaltyPoints}</span>
                                    </div>
                                </div>

                                {!loading && userData.loyaltyTitle && (
                                    <div className="mb-6">
                                        <label className="text-[#ffd700] text-sm font-bold block mb-1">Loyalty Title:</label>
                                        <span className="text-[#e0e0e0] text-sm">{userData.loyaltyTitle}</span>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-3">
                                    <button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold py-2 px-6 rounded-lg transition-all">
                                        Change Password
                                    </button>
                                    <button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold py-2 px-6 rounded-lg transition-all">
                                        Change Email
                                    </button>
                                    <button className="bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-all">
                                        Terminate Account
                                    </button>
                                </div>
                            </div>

                            {/* Account Badges */}
                            <div className="bg-[#1a1a1a] border border-[#404040]/60 rounded-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-[#ffd700] font-bold mb-1">Account Badges</h3>
                                        <p className="text-[#888] text-sm">
                                            The following account badges are displayed if other players search for your character.
                                        </p>
                                    </div>
                                    <button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold py-2 px-6 rounded-lg transition-all">
                                        Edit
                                    </button>
                                </div>
                                <div className="bg-[#0a0a0a] border border-[#404040]/60 rounded-lg p-4">
                                    <p className="text-[#888] text-sm">
                                        You have not unlocked any badges yet. Click on "Edit" to see the requirements for unlocking the single badges.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Products Available Tab */}
                    {activeTab === 'products' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-[#ffd700] mb-4">Products Available</h2>

                            {/* Codex Coins */}
                            <div className="bg-[#1a1a1a] border border-[#404040]/60 rounded-lg p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-[#ffd700] font-bold">Codex Coins</h3>
                                            <span className="text-2xl">🪙</span>
                                        </div>
                                        <p className="text-[#d0d0d0] text-sm mb-2">
                                            Get Codex Coins to shop exclusive products in the Store, including Mounts, Outfits, a Character Name Change or even Premium Time.
                                        </p>
                                    </div>
                                    <Link
                                        href="/shop"
                                        className="bg-green-700 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition-all whitespace-nowrap ml-4"
                                    >
                                        Get Codex Coins
                                    </Link>
                                </div>
                            </div>

                            {/* Extra Services */}
                            <div className="bg-[#1a1a1a] border border-[#404040]/60 rounded-lg p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-[#ffd700] font-bold mb-2">Extra Services</h3>
                                        <p className="text-[#d0d0d0] text-sm">
                                            Order a Recovery Key if you need a new one.
                                        </p>
                                    </div>
                                    <button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold py-2 px-6 rounded-lg transition-all whitespace-nowrap ml-4">
                                        Buy Recovery Key
                                    </button>
                                </div>
                            </div>

                            {/* Use Game Code */}
                            <div className="bg-[#1a1a1a] border border-[#404040]/60 rounded-lg p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-[#ffd700] font-bold mb-2">Use Game Code</h3>
                                        <p className="text-[#d0d0d0] text-sm mb-3">
                                            Enter your game code for Premium Time, Codex Coins or an Extra Service.
                                        </p>
                                        <input
                                            type="text"
                                            placeholder="Enter game code..."
                                            className="w-full max-w-md bg-[#0a0a0a] border-2 border-[#404040]/60 rounded-lg px-4 py-2 text-[#e0e0e0] focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all placeholder:text-[#666]"
                                        />
                                    </div>
                                    <button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold py-2 px-6 rounded-lg transition-all whitespace-nowrap ml-4">
                                        Use Game Code
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* History Tab */}
                    {activeTab === 'history' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-[#ffd700] mb-4">History</h2>

                            {/* Payments History */}
                            <div className="bg-[#1a1a1a] border border-[#404040]/60 rounded-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-[#ffd700] font-bold mb-1">Payments History</h3>
                                        <p className="text-[#888] text-sm">
                                            Contains all historical data of your payments.
                                        </p>
                                    </div>
                                    <button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold py-2 px-6 rounded-lg transition-all">
                                        View History
                                    </button>
                                </div>
                            </div>

                            {/* Coins History */}
                            <div className="bg-[#1a1a1a] border border-[#404040]/60 rounded-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-[#ffd700] font-bold mb-1">Coins History</h3>
                                        <p className="text-[#888] text-sm">
                                            Contains all historical data about your Codex Coins and products buyable with Codex Coins.
                                        </p>
                                    </div>
                                    <button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold py-2 px-6 rounded-lg transition-all">
                                        View History
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Two-Factor Authentication Tab */}
                    {activeTab === '2fa' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-[#ffd700] mb-4">Two-Factor Authentication</h2>

                            <div className="bg-[#1a1a1a] border border-[#404040]/60 rounded-lg p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-[#ffd700] font-bold mb-3">
                                            Connect your Codex account to an authenticator app!
                                        </h3>
                                        <p className="text-[#d0d0d0] text-sm mb-4">
                                            As a first step to connect an <strong>authenticator app</strong> to your account, click on "Activate"!
                                            Then pick up your phone, read the QR code and enter the authentication code shown.
                                        </p>
                                        <div className="bg-[#0a0a0a] border border-[#404040]/60 rounded-lg p-4 mb-4">
                                            <p className="text-[#888] text-sm">
                                                🔒 Two-factor authentication is currently <strong className="text-red-400">not activated</strong> for your account.
                                            </p>
                                        </div>
                                    </div>
                                    <button className="bg-green-700 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition-all whitespace-nowrap ml-4">
                                        Activate
                                    </button>
                                </div>

                                <div className="border-t border-[#404040]/60 pt-4">
                                    <h4 className="text-[#ffd700] font-bold mb-2">Benefits of 2FA:</h4>
                                    <ul className="space-y-2 text-[#d0d0d0] text-sm">
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-400">✓</span>
                                            <span>Enhanced account security</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-400">✓</span>
                                            <span>Protection against unauthorized access</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-400">✓</span>
                                            <span>Works with Google Authenticator, Authy, and other apps</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Back Link */}
                <div className="mt-8 text-center">
                    <Link
                        href="/account"
                        className="text-[#d0d0d0] hover:text-[#ffd700] text-sm transition-colors inline-flex items-center gap-2"
                    >
                        <span>←</span>
                        Back to Account Overview
                    </Link>
                </div>
            </main>
        </div>
    )
}
