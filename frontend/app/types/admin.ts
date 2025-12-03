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

export interface AdminPlayer {
    id: number
    name: string
    accountId: number
    accountEmail: string
    vocation: string
    level: number
    experience: number
    health: number
    healthMax: number
    mana: number
    manaMax: number
    magicLevel: number
    skillFist: number
    skillClub: number
    skillSword: number
    skillAxe: number
    skillDist: number
    skillShielding: number
    skillFishing: number
    soul: number
    cap: number
    townId: number
    townName: string
    guildName: string
    guildRank: string
    groupId: number
    status: string
    lastLogin?: string
    createdAt: string
}

export interface AdminPlayersResponse {
    players: AdminPlayer[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

