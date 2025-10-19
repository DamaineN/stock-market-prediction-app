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
  forceRefreshUser: () => Promise<boolean>
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
      console.log('Checking auth status, token exists:', !!token)
      
      if (!token) {
        console.log('No token found, setting not authenticated')
        setIsLoading(false)
        return
      }

      // Verify token is still valid
      console.log('Verifying token...')
      const tokenStatus: VerifyTokenResponse = await AuthService.verifyToken()
      console.log('Token verification result:', tokenStatus)
      
      if (tokenStatus.valid) {
        // Get user profile
        console.log('Token valid, fetching profile...')
        const userProfile = await AuthService.getProfile()
        console.log('Profile fetched:', userProfile)
        setUser(userProfile)
        setIsAuthenticated(true)
      } else {
        // Token invalid, clear auth state
        console.log('Token invalid, clearing auth state')
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
      console.log('Attempting login for:', email)
      const tokens = await AuthService.login({ email, password })
      console.log('Login successful, tokens received:', !!tokens)
      
      // Set as authenticated first
      setIsAuthenticated(true)

      // If hardcoded admin, synthesize profile and set user
      try {
        const tokenParts = tokens.access_token.split('.')
        const payload = JSON.parse(atob(tokenParts[1]))
        if (payload?.email === 'admin@stolckr.com' && payload?.role === 'admin') {
          const adminProfile = {
            id: 'admin_hardcoded',
            email: 'admin@stolckr.com',
            full_name: 'Admin',
            role: 'admin',
            is_verified: true,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            profile_picture: null,
          }
          setUser(adminProfile as any)
          // Don't redirect here - let the login page handle routing
          return
        }
      } catch (_) {}
      
      // Try to get user profile with retry logic
      let userProfile = null
      let attempts = 0
      const maxAttempts = 3
      
      while (attempts < maxAttempts && !userProfile) {
        try {
          await new Promise(resolve => setTimeout(resolve, attempts * 1000)) // Progressive delay
          userProfile = await AuthService.getProfile()
          setUser(userProfile)
          return // Success, exit early
        } catch (profileError) {
          attempts++
          console.warn(`Profile fetch attempt ${attempts}/${maxAttempts} failed:`, {
            error: profileError,
            hasToken: !!localStorage.getItem('access_token'),
            email: email,
            attempt: attempts
          })
          
          if (attempts === maxAttempts) {
            // All attempts failed, use fallback
            // Try to get the user's name from stored registration data or use email as fallback
            const storedUserData = localStorage.getItem('temp_user_data')
            let fallbackFullName = email.split('@')[0] // Use email prefix as fallback
            
            if (storedUserData) {
              try {
                const parsedUserData = JSON.parse(storedUserData)
                fallbackFullName = parsedUserData.full_name || fallbackFullName
                localStorage.removeItem('temp_user_data') // Clean up
              } catch (e) {
                // Ignore parsing errors
              }
            }
            
            // Try to get role from JWT token
            let userRole = 'beginner' // Default fallback
            try {
              const token = localStorage.getItem('access_token')
              if (token) {
                const tokenParts = token.split('.')
                if (tokenParts.length === 3) {
                  const payload = JSON.parse(atob(tokenParts[1]))
                  userRole = payload.role || 'beginner'
                }
              }
            } catch (e) {
              console.log('Could not extract role from token, using default')
            }
            
            setUser({
              id: 'temp',
              email: email,
              full_name: fallbackFullName,
              role: userRole,
              is_verified: false,
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            
            // Set up background retry to get real profile data
            setTimeout(async () => {
              try {
                const realProfile = await AuthService.getProfile()
                setUser(realProfile)
                console.log('Successfully updated to real profile data')
              } catch (e) {
                console.log('Background profile fetch still failing, will retry later')
              }
            }, 5000) // Retry after 5 seconds
          }
        }
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
      // Instead of forcing logout, keep the current user data if available
      if (!user) {
        // Only logout if we don't have any user data
        logout()
      }
      // Otherwise, keep the existing user object and just log the error
    }
  }
  
  const forceRefreshUser = async (): Promise<boolean> => {
    try {
      if (isAuthenticated) {
        const userProfile = await AuthService.getProfile()
        setUser(userProfile)
        return true
      }
      return false
    } catch (error) {
      console.error('Force refresh failed:', error)
      return false
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
    forceRefreshUser
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
