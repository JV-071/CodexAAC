'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useServerName } from '../../hooks/useServerName'

interface CoinPackage {
    id: string
    coins: number
    price: number
    icon: string
    popular?: boolean
}

interface PaymentMethod {
    id: string
    name: string
    icon: string
    description: string
}

export default function DonatePage() {
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
    const [customAmount, setCustomAmount] = useState('')
    const [selectedPayment, setSelectedPayment] = useState<string | null>(null)
    const [donorName, setDonorName] = useState('')
    const [donorEmail, setDonorEmail] = useState('')
    const [message, setMessage] = useState('')
    const [showPublicly, setShowPublicly] = useState(true)
    const serverName = useServerName()

    const coinPackages = [
        { id: 'pack1', coins: 100, price: 5, icon: '💰' },
        { id: 'pack2', coins: 250, price: 10, icon: '💰' },
        { id: 'pack3', coins: 500, price: 20, icon: '💰', popular: true },
        { id: 'pack4', coins: 1000, price: 35, icon: '💰' },
        { id: 'pack5', coins: 2500, price: 75, icon: '💰' },
        { id: 'pack6', coins: 5000, price: 140, icon: '💰' },
    ]

    const paymentMethods: PaymentMethod[] = [
        {
            id: 'pix',
            name: 'PIX',
            icon: '🇧🇷',
            description: 'Instant payment via PIX',
        },
        {
            id: 'paypal',
            name: 'PayPal',
            icon: '💳',
            description: 'Credit card or PayPal account',
        },
        {
            id: 'crypto',
            name: 'Crypto',
            icon: '₿',
            description: 'Bitcoin, Ethereum, USDT',
        },
        {
            id: 'mercadopago',
            name: 'Mercado Pago',
            icon: '💰',
            description: 'Card, boleto or balance',
        },
    ]

    const handleDonate = (e: React.FormEvent) => {
        e.preventDefault()

        const finalAmount = selectedAmount || parseFloat(customAmount)

        if (!finalAmount || finalAmount < 1) {
            alert('Please select or enter a valid amount')
            return
        }

        if (!selectedPayment) {
            alert('Please select a payment method')
            return
        }

        // Here you would integrate with payment API

        alert(`Thank you for your donation of $${finalAmount}! Redirecting to payment...`)
    }

    const getEffectiveAmount = () => {
        return selectedAmount || parseFloat(customAmount) || 0
    }

    return (
        <div>
            <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                        <span className="text-[#ffd700]">Support</span>{' '}
                        <span className="text-[#3b82f6]">{serverName}</span>
                    </h1>
                    <p className="text-[#d0d0d0] text-lg max-w-2xl mx-auto">
                        Your donation helps us keep the servers online, develop new content,
                        and provide the best experience for all players!
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Donation Tiers */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Coin Packages */}
                        <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl">
                            <h2 className="text-2xl font-bold text-[#ffd700] mb-6">Choose a Package</h2>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                                {coinPackages.map((pkg) => (
                                    <button
                                        key={pkg.id}
                                        onClick={() => {
                                            setSelectedAmount(pkg.price)
                                            setCustomAmount('')
                                        }}
                                        className={`relative p-4 rounded-lg border-2 transition-all ${selectedAmount === pkg.price
                                            ? 'border-[#ffd700] bg-[#ffd700]/10 shadow-lg shadow-[#ffd700]/20'
                                            : 'border-[#404040]/60 bg-[#1a1a1a] hover:border-[#505050]'
                                            }`}
                                    >
                                        {pkg.popular && (
                                            <div className="absolute -top-2 -right-2 bg-[#3b82f6] text-white text-xs font-bold px-2 py-1 rounded-full">
                                                BEST
                                            </div>
                                        )}
                                        <div className="text-center">
                                            <div className="text-3xl mb-2">{pkg.icon}</div>
                                            <div className="text-[#ffd700] font-bold text-lg mb-1">{pkg.coins} Coins</div>
                                            <div className="text-[#e0e0e0] font-bold text-xl">${pkg.price}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Custom Amount */}
                            <div>
                                <label className="block text-[#e0e0e0] text-sm font-medium mb-2">
                                    Or enter a custom amount
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666] text-lg">$</span>
                                    <input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        value={customAmount}
                                        onChange={(e) => {
                                            setCustomAmount(e.target.value)
                                            setSelectedAmount(null)
                                        }}
                                        className="w-full bg-[#1a1a1a] border-2 border-[#404040]/60 rounded-lg pl-8 pr-4 py-3 text-[#e0e0e0] focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all placeholder:text-[#666]"
                                        placeholder="Enter amount"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Payment Methods */}
                        <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl">
                            <h2 className="text-2xl font-bold text-[#ffd700] mb-6">Payment Method</h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {paymentMethods.map((method) => (
                                    <button
                                        key={method.id}
                                        onClick={() => setSelectedPayment(method.id)}
                                        className={`p-4 rounded-lg border-2 transition-all text-left ${selectedPayment === method.id
                                            ? 'border-[#3b82f6] bg-[#3b82f6]/10'
                                            : 'border-[#404040]/60 bg-[#1a1a1a] hover:border-[#505050]'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-3xl">{method.icon}</span>
                                            <h3 className="text-[#e0e0e0] font-bold">{method.name}</h3>
                                        </div>
                                        <p className="text-[#b0b0b0] text-sm">{method.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Donor Information */}
                        <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl">
                            <h2 className="text-2xl font-bold text-[#ffd700] mb-6">Information (Optional)</h2>

                            <form onSubmit={handleDonate} className="space-y-4">
                                <div>
                                    <label htmlFor="donorName" className="block text-[#e0e0e0] text-sm font-medium mb-2">
                                        Name or Nickname
                                    </label>
                                    <input
                                        id="donorName"
                                        type="text"
                                        value={donorName}
                                        onChange={(e) => setDonorName(e.target.value)}
                                        className="w-full bg-[#1a1a1a] border-2 border-[#404040]/60 rounded-lg px-4 py-3 text-[#e0e0e0] focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all placeholder:text-[#666]"
                                        placeholder="How would you like to be recognized?"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="donorEmail" className="block text-[#e0e0e0] text-sm font-medium mb-2">
                                        Email
                                    </label>
                                    <input
                                        id="donorEmail"
                                        type="email"
                                        value={donorEmail}
                                        onChange={(e) => setDonorEmail(e.target.value)}
                                        className="w-full bg-[#1a1a1a] border-2 border-[#404040]/60 rounded-lg px-4 py-3 text-[#e0e0e0] focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all placeholder:text-[#666]"
                                        placeholder="your@email.com"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-[#e0e0e0] text-sm font-medium mb-2">
                                        Message
                                    </label>
                                    <textarea
                                        id="message"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        rows={3}
                                        className="w-full bg-[#1a1a1a] border-2 border-[#404040]/60 rounded-lg px-4 py-3 text-[#e0e0e0] focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all placeholder:text-[#666] resize-none"
                                        placeholder="Leave a message for the community..."
                                    />
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="showPublicly"
                                        checked={showPublicly}
                                        onChange={(e) => setShowPublicly(e.target.checked)}
                                        className="w-5 h-5 bg-[#1a1a1a] border-2 border-[#404040]/60 rounded focus:ring-2 focus:ring-[#3b82f6]/20"
                                    />
                                    <label htmlFor="showPublicly" className="text-[#e0e0e0] text-sm">
                                        Show my donation publicly in the Hall of Fame
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={getEffectiveAmount() < 1 || !selectedPayment}
                                    className="w-full bg-[#ffd700] hover:bg-[#ffed4e] text-[#0a0a0a] font-bold py-4 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
                                >
                                    {getEffectiveAmount() > 0
                                        ? `Donate $${getEffectiveAmount().toFixed(2)}`
                                        : 'Select an amount'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Column - Info & Stats */}
                    <div className="space-y-6">
                        {/* Why Donate */}
                        <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl">
                            <h3 className="text-xl font-bold text-[#ffd700] mb-4">Why Donate?</h3>
                            <ul className="space-y-3">
                                {[
                                    { icon: '🖥️', text: 'Keep servers online 24/7' },
                                    { icon: '🎮', text: 'Develop new content' },
                                    { icon: '🛡️', text: 'Improve security and protection' },
                                    { icon: '⚡', text: 'Increase performance' },
                                    { icon: '🎨', text: 'Create exclusive events' },
                                    { icon: '💬', text: 'Dedicated support' },
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <span className="text-2xl">{item.icon}</span>
                                        <span className="text-[#d0d0d0] text-sm mt-1">{item.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Recent Donors */}
                        <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl">
                            <h3 className="text-xl font-bold text-[#ffd700] mb-4">Recent Donors</h3>
                            <div className="space-y-3">
                                {[
                                    { name: 'DragonSlayer', amount: 140, coins: 5000 },
                                    { name: 'MagicMaster', amount: 75, coins: 2500 },
                                    { name: 'Anonymous', amount: 35, coins: 1000 },
                                    { name: 'KnightWarrior', amount: 20, coins: 500 },
                                    { name: 'ElvenArcher', amount: 10, coins: 250 },
                                ].map((donor, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-[#404040]/60"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">💰</span>
                                            <div>
                                                <span className="text-[#e0e0e0] text-sm font-medium block">{donor.name}</span>
                                                <span className="text-[#ffd700] text-xs">{donor.coins} coins</span>
                                            </div>
                                        </div>
                                        <span className="text-[#3b82f6] font-bold text-sm">${donor.amount}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Security Note */}
                        <div className="bg-[#1a1a1a] rounded-xl border-2 border-[#3b82f6]/30 p-4">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">🔒</span>
                                <div>
                                    <h4 className="text-[#3b82f6] font-bold text-sm mb-1">Secure Payment</h4>
                                    <p className="text-[#b0b0b0] text-xs">
                                        All transactions are processed securely through certified payment gateways.
                                    </p>
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
