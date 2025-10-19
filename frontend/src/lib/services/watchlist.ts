import { apiClient } from './apiClient'

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
    return await apiClient.get<WatchlistResponse>('/api/v1/watchlist')
  }

  static async addToWatchlist(item: AddToWatchlistRequest): Promise<WatchlistItem> {
    return await apiClient.post<WatchlistItem>('/api/v1/watchlist', item)
  }

  static async removeFromWatchlist(symbol: string): Promise<void> {
    await apiClient.delete(`/api/v1/watchlist/${symbol.toUpperCase()}`)
  }

  static async updateWatchlistItem(symbol: string, updates: Partial<WatchlistItem>): Promise<WatchlistItem> {
    return await apiClient.put<WatchlistItem>(`/api/v1/watchlist/${symbol.toUpperCase()}`, updates)
  }

  static async getWatchlistStats(): Promise<WatchlistStats> {
    return await apiClient.get<WatchlistStats>('/api/v1/watchlist/stats')
  }

  static async refreshWatchlistPrices(): Promise<WatchlistResponse> {
    return await apiClient.post<WatchlistResponse>('/api/v1/watchlist/refresh')
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