export interface AdminStats {
    totalAccounts: number
    activeAccounts: number
    pendingDeletion: number
    totalCharacters: number
    onlineCharacters: number
    totalPremiumDays: number
    totalCoins: number
    accountsCreated24h: number
    accountsCreated7d: number
    accountsCreated30d: number
}

export interface AdminAccount {
    id: number
    email: string
    accountType: string
    premiumDays: number
    coins: number
    coinsTransferable: number
    createdAt: string
    lastLogin?: string
    status: string
    charactersCount: number
    isAdmin: boolean
}

export interface AdminAccountsResponse {
    accounts: AdminAccount[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

