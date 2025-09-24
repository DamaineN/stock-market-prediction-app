'use client'

import Layout from '@/components/Layout'
import { useState, useEffect } from 'react'
import { PlusIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { WatchlistService, WatchlistItem, WatchlistStats } from '@/lib/services/watchlist'
import { StocksService } from '@/lib/services/stocks'
import { useRealTimeStocks } from '@/hooks/useRealTimeStocks'
import { ConnectionStatus } from '@/components/ui/real-time-stock-price'
import ErrorBoundary, { ApiErrorFallback } from '@/components/ErrorBoundary'
import LoadingSpinner, { SkeletonTable } from '@/components/LoadingSpinner'

const mockWatchlistItems: WatchlistItem[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 185.50, change: 2.30, changePercent: 1.26 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2750.30, change: -15.20, changePercent: -0.55 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 425.75, change: 8.45, changePercent: 2.03 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 245.80, change: -3.20, changePercent: -1.28 },
]

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [stats, setStats] = useState<WatchlistStats | null>(null)
  const [newSymbol, setNewSymbol] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Get symbols from watchlist for real-time updates
  const watchlistSymbols = watchlist.map(item => item.symbol)
  const { stocksMap, isConnected, connectionError, addSymbol, removeSymbol } = useRealTimeStocks(watchlistSymbols)

  // Load watchlist on component mount
  useEffect(() => {
    loadWatchlist()
  }, [])

  // Sync real-time tracking with watchlist changes
  useEffect(() => {
    watchlistSymbols.forEach(symbol => {
      addSymbol(symbol)
    })
  }, [watchlist, addSymbol])

  const loadWatchlist = async () => {
    try {
      const response = await WatchlistService.getWatchlist()
      setWatchlist(response.items)
      setStats(WatchlistService.calculateStats(response.items))
    } catch (error) {
      console.error('Failed to load watchlist:', error)
      // Use mock data as fallback
      setWatchlist(mockWatchlistItems)
      setStats(WatchlistService.calculateStats(mockWatchlistItems))
    }
  }

  const addToWatchlist = async () => {
    if (!newSymbol.trim()) return

    setLoading(true)
    try {
      // Get stock info first
      const stockInfo = await StocksService.getStockInfo(newSymbol)
      
      // Add to backend watchlist
      await WatchlistService.addToWatchlist({
        symbol: newSymbol.toUpperCase(),
        name: stockInfo.name
      })
      
      // Add to real-time tracking
      addSymbol(newSymbol.toUpperCase())
      
      // Reload watchlist
      await loadWatchlist()
      setNewSymbol('')
    } catch (error) {
      console.error('Failed to add to watchlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFromWatchlist = async (symbol: string) => {
    try {
      await WatchlistService.removeFromWatchlist(symbol)
      removeSymbol(symbol) // Remove from real-time tracking
      await loadWatchlist()
    } catch (error) {
      console.error('Failed to remove from watchlist:', error)
      // Fallback to local removal
      removeSymbol(symbol)
      setWatchlist(watchlist.filter(item => item.symbol !== symbol))
    }
  }

  // Merge watchlist with real-time data
  const getDisplayItems = () => {
    return watchlist.map(item => {
      const realTimeData = stocksMap[item.symbol]
      if (realTimeData && realTimeData.price > 0) {
        return {
          ...item,
          price: realTimeData.price,
          change: realTimeData.change,
          changePercent: realTimeData.changePercent
        }
      }
      return item
    })
  }

  const refreshPrices = async () => {
    setRefreshing(true)
    try {
      await WatchlistService.refreshWatchlistPrices()
      await loadWatchlist()
    } catch (error) {
      console.error('Failed to refresh prices:', error)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Add to Watchlist */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Add Stock to Watchlist</h2>
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Enter stock symbol"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addToWatchlist()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addToWatchlist}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>{loading ? 'Adding...' : 'Add'}</span>
            </button>
          </div>
        </div>

        {/* Watchlist */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                My Watchlist ({watchlist.length} stocks)
              </h2>
              <div className="flex items-center space-x-4">
                <ConnectionStatus isConnected={isConnected} error={connectionError} />
                <button
                  onClick={refreshPrices}
                  disabled={refreshing}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
                >
                  <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
              </div>
            </div>
          </div>
          
          {watchlist.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">Your watchlist is empty. Add some stocks to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Symbol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Change
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getDisplayItems().map((item) => (
                    <tr key={item.symbol} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">{item.symbol}</span>
                          {stocksMap[item.symbol] && stocksMap[item.symbol].price > 0 && (
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Live updates"></div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">{item.name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          ${item.price.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${
                            item.change >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {item.change >= 0 ? '+' : ''}${item.change.toFixed(2)}
                          </span>
                          <span className={`text-sm ${
                            item.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ({item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%)
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-800 text-sm">
                            Predict
                          </button>
                          <button className="text-green-600 hover:text-green-800 text-sm">
                            View
                          </button>
                          <button
                            onClick={() => removeFromWatchlist(item.symbol)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
