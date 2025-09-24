'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AuthService, User, VerifyTokenResponse } from '@/lib/services/auth'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        setIsLoading(false)
        return
      }

      // Verify token is still valid
      const tokenStatus: VerifyTokenResponse = await AuthService.verifyToken()
      
      if (tokenStatus.valid) {
        // Get user profile
        const userProfile = await AuthService.getProfile()
        setUser(userProfile)
        setIsAuthenticated(true)
      } else {
        // Token invalid, clear auth state
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      // Clear invalid tokens
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const tokens = await AuthService.login({ email, password })
      
      // Set as authenticated first
      setIsAuthenticated(true)
      
      // Try to get user profile, but don't fail if it doesn't work
      try {
        const userProfile = await AuthService.getProfile()
        setUser(userProfile)
      } catch (profileError) {
        console.warn('Could not fetch profile after login:', profileError)
        // Create minimal user object from login data
        setUser({
          id: 'temp',
          email: email,
          full_name: 'User',
          role: 'basic',
          is_verified: false,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    } catch (error) {
      setUser(null)
      setIsAuthenticated(false)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    AuthService.logout()
    setUser(null)
    setIsAuthenticated(false)
    
    // Redirect to login page
    window.location.href = '/login'
  }

  const refreshUser = async () => {
    try {
      if (isAuthenticated) {
        const userProfile = await AuthService.getProfile()
        setUser(userProfile)
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
      // If profile fetch fails, user might need to re-login
      logout()
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser
  }

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
