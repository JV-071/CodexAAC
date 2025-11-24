'use client'

import Link from 'next/link'

export default function AdminNotFound() {
    return (
        <div className="min-h-screen">
            <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex flex-col items-center justify-center min-h-[70vh]">
                    {/* 404 Card */}
                    <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-12 shadow-2xl text-center max-w-2xl">
                        <div className="mb-6">
                            <span className="text-8xl">🗺️</span>
                        </div>

                        <h1 className="text-7xl font-bold mb-4">
                            <span className="text-[#ffd700]">4</span>
                            <span className="text-[#3b82f6]">0</span>
                            <span className="text-[#ffd700]">4</span>
                        </h1>

                        <h2 className="text-3xl font-bold text-[#e0e0e0] mb-4">
                            Page Not Found
                        </h2>

                        <p className="text-[#b0b0b0] text-lg mb-8 leading-relaxed">
                            This administrative feature has not been implemented yet or does not exist.
                        </p>

                        <div className="flex justify-center gap-4">
                            <Link
                                href="/admin"
                                className="bg-[#ffd700] hover:bg-[#ffed4e] text-[#0a0a0a] font-bold py-3 px-8 rounded-lg transition-all shadow-lg hover:shadow-xl"
                            >
                                ⚡ Back to Dashboard
                            </Link>
                            <Link
                                href="/"
                                className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold py-3 px-8 rounded-lg transition-all shadow-lg hover:shadow-xl"
                            >
                                🏠 Back to Site
                            </Link>
                        </div>

                        {/* Quick Links */}
                        <div className="mt-8 pt-8 border-t border-[#404040]/60">
                            <p className="text-[#888] text-sm mb-4">Available features:</p>
                            <div className="flex flex-wrap gap-3 justify-center">
                                <Link href="/admin" className="text-[#ffd700] hover:text-[#ffed4e] text-sm transition-colors">
                                    Dashboard
                                </Link>
                                <span className="text-[#404040]">•</span>
                                <Link href="/admin" className="text-[#ffd700] hover:text-[#ffed4e] text-sm transition-colors">
                                    Manage Accounts
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
