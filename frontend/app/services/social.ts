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
    if (cachedLinks) {
      return cachedLinks
    }

    if (linksPromise) {
      return linksPromise
    }

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




