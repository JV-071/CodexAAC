export interface Ticket {
    id: number
    subject: string
    status: 'open' | 'closed' | 'pending'
    date: string
}

export interface AccountInfo {
    email: string
    accountType: string
    premiumDays: number
    vipExpiry?: string
    createdAt: string
    lastLogin?: string
    codexCoins: number
    codexCoinsTransferable: number
    loyaltyPoints: number
    loyaltyTitle?: string
    deletionScheduledAt?: number
    status: string
}

export interface ApiResponse<T> {
    message: string
    status: string
    data: T
}

export interface AccountApiResponse extends ApiResponse<AccountInfo> {}

