const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Helper function to get auth header
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

// Watchlist types
export interface WatchlistItem {
  id?: string
  symbol: string
  name: string
  price?: number
  change?: number
  changePercent?: number
  volume?: number
  marketCap?: number
  addedAt?: string
}

export interface WatchlistResponse {
  items: WatchlistItem[]
  count: number
  lastUpdated?: string
}

export interface AddToWatchlistRequest {
  symbol: string
  name?: string
}

export interface WatchlistStats {
  totalItems: number
  totalValue: number
  totalGain: number
  totalGainPercent: number
  topGainer?: WatchlistItem
  topLoser?: WatchlistItem
}

// Watchlist API service
export class WatchlistService {
  static async getWatchlist(): Promise<WatchlistResponse> {
    const response = await fetch(`${API_URL}/api/v1/watchlist`, {
      headers: getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch watchlist')
    }
    
    return await response.json()
  }

  static async addToWatchlist(item: AddToWatchlistRequest): Promise<WatchlistItem> {
    const response = await fetch(`${API_URL}/api/v1/watchlist`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(item)
    })
    
    if (!response.ok) {
      throw new Error('Failed to add to watchlist')
    }
    
    return await response.json()
  }

  static async removeFromWatchlist(symbol: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/v1/watchlist/${symbol.toUpperCase()}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to remove from watchlist')
    }
  }

  static async updateWatchlistItem(symbol: string, updates: Partial<WatchlistItem>): Promise<WatchlistItem> {
    try {
      const response = await apiClient.put(`/watchlist/${symbol.toUpperCase()}`, updates)
      return handleApiResponse<WatchlistItem>(response)
    } catch (error) {
      handleApiError(error)
    }
  }

  static async getWatchlistStats(): Promise<WatchlistStats> {
    try {
      const response = await apiClient.get('/watchlist/stats')
      return handleApiResponse<WatchlistStats>(response)
    } catch (error) {
      handleApiError(error)
    }
  }

  static async refreshWatchlistPrices(): Promise<WatchlistResponse> {
    try {
      const response = await apiClient.post('/watchlist/refresh')
      return handleApiResponse<WatchlistResponse>(response)
    } catch (error) {
      handleApiError(error)
    }
  }

  // Helper methods
  static calculateStats(items: WatchlistItem[]): WatchlistStats {
    if (!items.length) {
      return {
        totalItems: 0,
        totalValue: 0,
        totalGain: 0,
        totalGainPercent: 0
      }
    }

    const totalValue = items.reduce((sum, item) => sum + (item.price || 0), 0)
    const totalGain = items.reduce((sum, item) => sum + (item.change || 0), 0)
    const totalGainPercent = totalGain / (totalValue - totalGain) * 100

    // Find top gainer and loser
    const sortedByChange = [...items].sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0))
    const topGainer = sortedByChange[0]
    const topLoser = sortedByChange[sortedByChange.length - 1]

    return {
      totalItems: items.length,
      totalValue,
      totalGain,
      totalGainPercent,
      topGainer: topGainer?.changePercent && topGainer.changePercent > 0 ? topGainer : undefined,
      topLoser: topLoser?.changePercent && topLoser.changePercent < 0 ? topLoser : undefined
    }
  }

  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  static formatPercent(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  static getChangeColor(change: number): string {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }
}