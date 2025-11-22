// Server configuration service
// Fetches server information from config.lua via backend API

import { api } from './api'

export interface ServerConfig {
  serverName: string
  worldType: string
  ip: string
  loginPort: number
  gamePort: number
  rateExp: number
  rateSkill: number
  rateMagic: number
  rateLoot: number
  rateSpawn: number
  mapName: string
  mapAuthor: string
  houseRentPeriod: string
  maxPlayers: number
  ownerName: string
  ownerEmail: string
  url: string
  location: string
}

let cachedConfig: ServerConfig | null = null
let configPromise: Promise<ServerConfig> | null = null

export const serverService = {
  // Get server configuration (with caching)
  async getConfig(): Promise<ServerConfig> {
    // Return cached config if available
    if (cachedConfig) {
      return cachedConfig
    }

    // If a request is already in progress, return that promise
    if (configPromise) {
      return configPromise
    }

    // Fetch config from API
    // Backend returns: { message, status, data }
    configPromise = api.get<{ message: string; status: string; data: ServerConfig }>('/server/config', { public: true })
      .then(response => {
        cachedConfig = response.data
        return response.data
      })
      .finally(() => {
        configPromise = null
      })

    return configPromise
  },

  // Clear cache (useful if config is reloaded)
  clearCache(): void {
    cachedConfig = null
    configPromise = null
  },

  // Get server name (convenience method)
  async getServerName(): Promise<string> {
    const config = await this.getConfig()
    return config.serverName || 'CodexAAC'
  },
}

