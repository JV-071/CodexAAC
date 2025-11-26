'use client'

import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react'
import { authService, isDevelopment } from '../services/auth'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  checkAuth: () => Promise<void>
  setAuthenticated: (value: boolean) => void
  logout: () => Promise<void>
}

type AuthStateCallback = (isAuthenticated: boolean) => void

class AuthStateManager {
  private callbacks: Set<AuthStateCallback> = new Set()

  subscribe(callback: AuthStateCallback): () => void {
    this.callbacks.add(callback)
    return () => {
      this.callbacks.delete(callback)
    }
  }

  notifyUnauthorized(): void {
    this.callbacks.forEach(callback => callback(false))
  }
}

export const authStateManager = new AuthStateManager()

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const channelRef = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    channelRef.current = new BroadcastChannel('auth')
    
    channelRef.current.onmessage = (event) => {
      if (event.data.type === 'AUTH_STATE_CHANGED') {
        setIsAuthenticated(event.data.isAuthenticated)
        if (event.data.isLoading !== undefined) {
          setIsLoading(event.data.isLoading)
        }
      }
    }

    return () => {
      channelRef.current?.close()
    }
  }, [])

  const checkAuth = useCallback(async () => {
    setIsLoading(true)
    
    if (isDevelopment) {
      const authenticated = authService.isAuthenticated()
      setIsAuthenticated(authenticated)
      setIsLoading(false)
    } else {
      try {
        const authenticated = await authService.checkAuthAsync()
        setIsAuthenticated(authenticated)
      } catch {
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }
  }, [])

  const setAuthenticated = useCallback((value: boolean) => {
    setIsAuthenticated(value)
    
    if (channelRef.current) {
      channelRef.current.postMessage({ 
        type: 'AUTH_STATE_CHANGED', 
        isAuthenticated: value 
      })
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    setAuthenticated(false)
    
    try {
      await authService.logout()
    } catch (error) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  }, [setAuthenticated])

  useEffect(() => {
    const unsubscribe = authStateManager.subscribe((isAuthenticated) => {
      setAuthenticated(isAuthenticated)
    })
    return unsubscribe
  }, [setAuthenticated])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const value = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      checkAuth,
      setAuthenticated,
      logout,
    }),
    [isAuthenticated, isLoading, checkAuth, setAuthenticated, logout]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

