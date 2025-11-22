'use client'

import { useState, useEffect } from 'react'
import { socialService } from '../services/social'

export interface SocialLinks {
  facebook: string
  instagram: string
  whatsapp: string
  discord: string
}

/**
 * Custom hook to get social media links from config
 * Uses socialService cache to avoid multiple API calls
 * @returns {SocialLinks} Social media links (defaults to empty strings while loading or on error)
 */
export function useSocialLinks(): SocialLinks {
  const [links, setLinks] = useState<SocialLinks>({
    facebook: '',
    instagram: '',
    whatsapp: '',
    discord: '',
  })

  useEffect(() => {
    socialService.getLinks().then(setLinks).catch(() => {
      // Fallback to empty strings on error (links won't be clickable)
      setLinks({
        facebook: '',
        instagram: '',
        whatsapp: '',
        discord: '',
      })
    })
  }, [])

  return links
}


