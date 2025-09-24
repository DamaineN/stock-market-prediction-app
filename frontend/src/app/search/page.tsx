'use client'

import Layout from '@/components/Layout'
import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { StocksService, SearchResult, StockInfo } from '@/lib/services/stocks'
import { useRealTimeStocks } from '@/hooks/useRealTimeStocks'
import { RealTimeStockPrice } from '@/components/ui/real-time-stock-price'
import StockChart from '@/components/StockChart'

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedStock, setSelectedStock] = useState<StockInfo | null>(null)
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [chartLoading, setChartLoading] = useState(false)
  
  // Real-time stock updates for selected stock
  const selectedSymbol = selectedStock ? [selectedStock.symbol] : []
  const { getStock, addSymbol, removeSymbol } = useRealTimeStocks(selectedSymbol)

  const handleSearch = async () => {
    if (!searchTerm.trim()) return
    
    setLoading(true)
    try {
      const response = await StocksService.searchStocks(searchTerm, 10)
      setSearchResults(response.results)
    } catch (error) {
      console.error('Search failed:', error)
      // Mock results for demo
      setSearchResults([
        {
          symbol: searchTerm.toUpperCase(),
          name: `${searchTerm.toUpperCase()} Corporation`,
          type: 'Stock',
          region: 'US',
          marketOpen: '09:30',
          marketClose: '16:00',
          timezone: 'EST',
          currency: 'USD'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleStockSelect = async (stock: SearchResult) => {
    setSelectedStock(null)
    setHistoricalData([])
    setLoading(true)
    
    try {
      const stockData = await StocksService.getStockInfo(stock.symbol)
      setSelectedStock(stockData)
      addSymbol(stock.symbol) // Add to real-time tracking
      
      // Fetch historical data for chart
      setChartLoading(true)
      try {
        const historical = await StocksService.getHistoricalData(stock.symbol, '3mo', '1d')
        const chartData = StocksService.formatChartData(historical.data)
        setHistoricalData(chartData)
      } catch (chartError) {
        console.error('Failed to get historical data:', chartError)
        // Generate mock chart data
        const mockData = Array.from({ length: 60 }, (_, i) => ({
          date: new Date(Date.now() - (59 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          price: 150 + Math.sin(i / 10) * 20 + Math.random() * 10,
          volume: Math.floor(Math.random() * 1000000) + 500000
        }))
        setHistoricalData(mockData)
      } finally {
        setChartLoading(false)
      }
    } catch (error) {
      console.error('Failed to get stock info:', error)
      // Mock data for demo
      setSelectedStock({
        symbol: stock.symbol,
        name: stock.name,
        sector: 'Technology',
        industry: 'Software',
        market_cap: 2500000000000,
        price: 185.50
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Enter stock symbol (e.g., AAPL, GOOGL, MSFT)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
              <span>{loading ? 'Searching...' : 'Search'}</span>
            </button>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Search Results</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {searchResults.map((stock, index) => (
                <div
                  key={index}
                  onClick={() => handleStockSelect(stock)}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{stock.symbol}</h3>
                      <p className="text-sm text-gray-500">{stock.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{stock.type}</p>
                      <p className="text-xs text-gray-400">{stock.region}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stock Details */}
        {selectedStock && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Stock Information</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedStock.symbol}</h3>
                  <p className="text-lg text-gray-600">{selectedStock.name}</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Sector:</span>
                      <span className="text-sm font-medium">{selectedStock.sector}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Industry:</span>
                      <span className="text-sm font-medium">{selectedStock.industry}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="space-y-4">
                    {/* Real-time price display */}
                    {getStock(selectedStock.symbol) ? (
                      <RealTimeStockPrice 
                        stock={getStock(selectedStock.symbol)!} 
                        showSymbol={false}
                      />
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-lg font-medium text-gray-900">Current Price</h4>
                        <p className="text-3xl font-bold text-green-600">
                          ${selectedStock.price?.toFixed(2) || 'N/A'}
                        </p>
                      </div>
                    )}
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500">Market Cap</h4>
                      <p className="text-lg font-medium">
                        ${selectedStock.market_cap ? (selectedStock.market_cap / 1e12).toFixed(2) + 'T' : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Stock Chart */}
              {historicalData.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">3-Month Price History</h4>
                  {chartLoading ? (
                    <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Loading chart...</span>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <StockChart
                        historicalData={historicalData.map(d => ({
                          date: d.date,
                          price: d.price,
                          volume: d.volume
                        }))}
                        symbol={selectedStock.symbol}
                        height={300}
                      />
                    </div>
                  )}
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="mt-6 flex space-x-4">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Get Prediction
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                  Add to Watchlist
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                  View Historical Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
