'use client'

import Link from 'next/link'

export default function NotFound() {
    return (
        <div>
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
                            Oops! It looks like you've ventured into uncharted territory.
                            The page you're looking for doesn't exist or has been moved to another realm.
                        </p>

                        <div className="flex justify-center">
                            <Link
                                href="/"
                                className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold py-3 px-8 rounded-lg transition-all shadow-lg hover:shadow-xl"
                            >
                                🏠 Return to Home
                            </Link>
                        </div>

                        {/* Quick Links */}
                        <div className="mt-8 pt-8 border-t border-[#404040]/60">
                            <p className="text-[#888] text-sm mb-4">Or explore these sections:</p>
                            <div className="flex flex-wrap gap-3 justify-center">
                                <Link href="/account" className="text-[#3b82f6] hover:text-[#60a5fa] text-sm transition-colors">
                                    Account
                                </Link>
                                <span className="text-[#404040]">•</span>
                                <Link href="/contribute/donate" className="text-[#3b82f6] hover:text-[#60a5fa] text-sm transition-colors">
                                    Donate
                                </Link>
                                <span className="text-[#404040]">•</span>
                                <Link href="/download" className="text-[#3b82f6] hover:text-[#60a5fa] text-sm transition-colors">
                                    Download
                                </Link>
                                <span className="text-[#404040]">•</span>
                                <Link href="/shop" className="text-[#3b82f6] hover:text-[#60a5fa] text-sm transition-colors">
                                    Shop
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
