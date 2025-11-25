'use client'

import { useState, useEffect } from 'react'
import { serverService } from '../services/server'

/**
 * Custom hook to get server name from config
 * Uses serverService cache to avoid multiple API calls
 * @returns {string} Server name (defaults to 'CodexAAC' while loading or on error)
 */
export function useServerName(): string {
  const [serverName, setServerName] = useState('CodexAAC')

  useEffect(() => {
    serverService.getServerName().then(setServerName).catch(() => {
      setServerName('CodexAAC')
    })
  }, [])

  return serverName
}

