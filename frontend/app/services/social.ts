// Social media links service
// Fetches social media links from backend API

import { api } from './api'

export interface SocialLinks {
  facebook: string
  instagram: string
  whatsapp: string
  discord: string
}

let cachedLinks: SocialLinks | null = null
let linksPromise: Promise<SocialLinks> | null = null

export const socialService = {
  /**
   * Fetches social media links from the backend API.
   * Caches the result to avoid redundant API calls.
   * @returns {Promise<SocialLinks>} A promise that resolves with the social links.
   */
  async getLinks(): Promise<SocialLinks> {
    // Return cached links if available
    if (cachedLinks) {
      return cachedLinks
    }

    // If a request is already in progress, return that promise
    if (linksPromise) {
      return linksPromise
    }

    // Fetch links from API
    // Backend returns: { message, status, data }
    linksPromise = api.get<{ message: string; status: string; data: SocialLinks }>('/social/links', { public: true })
      .then(response => {
        if (!response.data) {
          throw new Error('Invalid social links response: data is missing.')
        }
        cachedLinks = response.data
        return response.data
      })
      .finally(() => {
        linksPromise = null
      })
    
    return linksPromise
  },

  /**
   * Clears the cached social links.
   * Useful if the links are updated on the backend.
   */
  clearCache(): void {
    cachedLinks = null
    linksPromise = null
  },
}


