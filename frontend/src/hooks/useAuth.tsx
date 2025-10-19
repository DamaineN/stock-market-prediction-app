'use client'

import { useState, useEffect, useContext, createContext, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService, User } from '@/lib/services/auth'
import { apiClient } from '@/lib/services/apiClient'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const isAuthenticated = !!user

  // Check authentication status on mount and when token changes
  useEffect(() => {
    checkAuthStatus()
  }, [])

  // Periodic token validation (every 5 minutes)
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(() => {
      validateToken()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [isAuthenticated])

  const checkAuthStatus = async () => {
    try {
      if (!apiClient.isAuthenticated()) {
        setIsLoading(false)
        return
      }

      // Try to get user profile to validate token
      const profile = await AuthService.getProfile()
      setUser(profile)
    } catch (error) {
      console.error('Auth check failed:', error)
      // Token might be expired, try to refresh
      await tryRefreshToken()
    } finally {
      setIsLoading(false)
    }
  }

  const validateToken = async () => {
    try {
      if (!apiClient.isAuthenticated()) {
        logout()
        return
      }

      const validation = await AuthService.verifyToken()
      if (!validation.valid) {
        // Token invalid, try to refresh
        await tryRefreshToken()
      }
    } catch (error) {
      console.error('Token validation failed:', error)
      await tryRefreshToken()
    }
  }

  const tryRefreshToken = async () => {
    try {
      await AuthService.refreshToken()
      // Re-fetch user profile after successful refresh
      const profile = await AuthService.getProfile()
      setUser(profile)
    } catch (error) {
      console.error('Token refresh failed:', error)
      logout()
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      await AuthService.login({ email, password })
      
      // Get user profile after successful login
      const profile = await AuthService.getProfile()
      setUser(profile)
      
      // Redirect to dashboard or home
      router.push('/dashboard')
    } catch (error) {
      throw error // Re-throw for component to handle
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    AuthService.logout()
    setUser(null)
    router.push('/login')
  }

  const refreshAuth = async () => {
    await checkAuthStatus()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshAuth,
      }}
    >
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

// Higher-order component for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/login')
      }
    }, [isAuthenticated, isLoading, router])

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return null // Will redirect to login
    }

    return <Component {...props} />
  }
}