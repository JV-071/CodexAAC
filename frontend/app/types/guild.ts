/**
 * Guild-related types and interfaces
 */

export interface GuildMember {
    playerId: number
    name: string
    level: number
    vocation: string
    rank: string
    rankLevel: number
    nick?: string
    status: 'online' | 'offline'
}

export interface GuildRank {
    id: number
    name: string
    level: number
}

export interface PendingInviteItem {
    playerId: number
    playerName: string
    level: number
    vocation: string
    inviteDate: number
}

export interface GuildDetails {
    id: number
    name: string
    level: number
    ownerId: number
    ownerName: string
    createdAt: string
    motd?: string
    balance: number
    points: number
    memberCount: number
    members: GuildMember[]
    ranks: GuildRank[]
    pendingInvites: PendingInviteItem[]
    hasPendingInvite?: boolean
    isMember?: boolean
    canInvite?: boolean
}

export interface GuildListItem {
    id: number
    name: string
    level: number
    ownerName: string
    memberCount: number
    points: number
}

export interface GuildsResponse {
    guilds: GuildListItem[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export interface CreateGuildRequest {
    name: string
    characterName: string
    motd?: string
}

export interface CreateGuildResponse {
    id: number
    name: string
    message: string
}

export interface InvitePlayerRequest {
    playerName: string
}

export interface InvitePlayerResponse {
    message: string
}

export interface AcceptInviteRequest {
    guildName: string
}

export interface AcceptInviteResponse {
    message: string
}

export interface PendingInvite {
    guildId: number
    guildName: string
    guildLevel: number
    guildPoints: number
    playerName: string
    inviteDate: number
}

export interface LeaveGuildRequest {
    guildName: string
}

export interface LeaveGuildResponse {
    message: string
}

export interface KickPlayerRequest {
    guildName: string
    playerName: string
}

export interface KickPlayerResponse {
    message: string
}

