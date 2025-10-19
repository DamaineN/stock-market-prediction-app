import { apiClient } from './apiClient'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Authentication types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  full_name: string
  role?: 'beginner' | 'casual' | 'paper_trader' | 'admin'
  quiz_answers?: Record<number, number> // Optional quiz answers
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type?: string
}

export interface User {
  id: string
  email: string
  full_name: string
  role: string
  is_verified: boolean
  status: string
  created_at: string
  updated_at: string
  last_login?: string
}

export interface VerifyTokenResponse {
  valid: boolean
  user_id?: string
  email?: string
  role?: string
}

// Auth API service
export class AuthService {
  static async login(credentials: LoginRequest): Promise<TokenResponse> {
    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Login failed')
    }

    const tokens = await response.json()
    
    // Store tokens in localStorage
    localStorage.setItem('access_token', tokens.access_token)
    localStorage.setItem('refresh_token', tokens.refresh_token)
    
    return tokens
  }

  static async register(userData: RegisterRequest): Promise<TokenResponse> {
    const response = await fetch(`${API_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...userData,
        role: userData.role || 'beginner'
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Registration failed')
    }

    const tokens = await response.json()
    
    // Store tokens in localStorage
    localStorage.setItem('access_token', tokens.access_token)
    localStorage.setItem('refresh_token', tokens.refresh_token)
    
    return tokens
  }

  static async getProfile(): Promise<User> {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${API_URL}/api/v1/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to get profile')
    }

    return await response.json()
  }

  static async verifyToken(): Promise<VerifyTokenResponse> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        return { valid: false }
      }

      const response = await fetch(`${API_URL}/api/v1/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        return { valid: false }
      }

      return await response.json()
    } catch (error) {
      return { valid: false }
    }
  }

  static async refreshToken(): Promise<TokenResponse> {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken
      }),
    })

    if (!response.ok) {
      // Clear tokens on refresh failure
      this.logout()
      const error = await response.json()
      throw new Error(error.detail || 'Token refresh failed')
    }

    const tokens = await response.json()
    
    // Update stored tokens
    localStorage.setItem('access_token', tokens.access_token)
    localStorage.setItem('refresh_token', tokens.refresh_token)
    
    return tokens
  }

  static logout(): void {
    apiClient.clearAuth()
  }

  static isAuthenticated(): boolean {
    return apiClient.isAuthenticated()
  }

  static getToken(): string | null {
    return apiClient.getToken()
  }
}