'use client'

import Layout from '@/components/Layout'
import { useState, useEffect } from 'react'
import { ChartBarIcon } from '@heroicons/react/24/outline'
import { StocksService, SearchResult, StockInfo } from '@/lib/services/stocks'
import { useRealTimeStocks } from '@/hooks/useRealTimeStocks'
import { RealTimeStockPrice } from '@/components/ui/real-time-stock-price'
import StockChart from '@/components/StockChart'
import StockSearchDropdown from '@/components/ui/StockSearchDropdown'
import PaperTrade from '@/components/trading/PaperTrade'
import RoleBasedFeatures from '@/components/features/RoleBasedFeatures'
import { useXPProgress } from '@/hooks/useXPProgress'

export default function SearchPage() {
  const [selectedStock, setSelectedStock] = useState<StockInfo | null>(null)
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [chartLoading, setChartLoading] = useState(false)
  
  // Get user's actual role based on XP progress
  const { xpProgress, loading: xpLoading, error: xpError } = useXPProgress()
  
  // Map backend role to frontend role format - NO FALLBACKS
  const mapRole = (backendRole: string): 'beginner' | 'casual' | 'paper-trader' => {
    const normalized = backendRole.toLowerCase().trim()
    console.log('Mapping backend role:', backendRole, '-> normalized:', normalized)
    
    // Handle different role formats
    if (normalized.includes('paper') || normalized.includes('trade')) {
      return 'paper-trader'
    }
    if (normalized === 'casual' || normalized.includes('casual')) {
      return 'casual'
    }
    if (normalized === 'beginner' || normalized.includes('beginner')) {
      return 'beginner'
    }
    
    throw new Error(`Unknown role format: ${backendRole}`)
  }
  
  // Only map role if we have valid XP progress data
  let userRole: 'beginner' | 'casual' | 'paper-trader' | null = null
  if (xpProgress?.current_role) {
    try {
      userRole = mapRole(xpProgress.current_role)
      console.log('Final mapped userRole:', userRole)
    } catch (error) {
      console.error('Failed to map user role:', error)
    }
  }
  
  // Real-time stock updates for selected stock
  const selectedSymbol = selectedStock ? [selectedStock.symbol] : []
  const { getStock, addSymbol, removeSymbol } = useRealTimeStocks(selectedSymbol)


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
        console.log('Historical data received:', historical)
        
        // Validate that we have data before formatting
        if (historical.data && historical.data.length > 0) {
          console.log('Sample data point:', historical.data[0])
          const chartData = StocksService.formatChartData(historical.data)
          setHistoricalData(chartData)
        } else {
          throw new Error('No historical data available')
        }
      } catch (chartError) {
        console.error('Failed to get historical data:', chartError)
        console.log('Using fallback mock chart data')
        
        // Generate mock chart data with proper date formatting
        const mockData = Array.from({ length: 60 }, (_, i) => {
          const date = new Date(Date.now() - (59 - i) * 24 * 60 * 60 * 1000)
          return {
            date: date.toISOString().split('T')[0],
            price: Math.round((150 + Math.sin(i / 10) * 20 + Math.random() * 10) * 100) / 100,
            volume: Math.floor(Math.random() * 1000000) + 500000
          }
        })
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
        {/* Stock Search */}
        <div className="bg-white p-6 rounded-lg shadow">
          <StockSearchDropdown
            onSelect={handleStockSelect}
            placeholder="Search for stocks (e.g., Apple, Google, Microsoft)"
            label="Search Stocks"
            maxResults={10}
            showFullSearch={false}
          />
        </div>

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
              <div className="mt-6 flex flex-wrap gap-4">
                <button 
                  onClick={() => window.location.href = `/predictions?symbol=${selectedStock.symbol}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                >
                  <ChartBarIcon className="w-4 h-4" />
                  <span>Get Prediction</span>
                </button>
                <button 
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/v1/watchlist/add', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                        },
                        body: JSON.stringify({ symbol: selectedStock.symbol })
                      })
                      if (response.ok) {
                        alert('Stock added to watchlist!')
                      }
                    } catch (error) {
                      console.error('Error adding to watchlist:', error)
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
                >
                  <span>Add to Watchlist</span>
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center space-x-2">
                  <span>View Historical Data</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Role-based Features - includes Paper Trading as primary for 'paper-trader' */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Your Experience Workspace</h2>
            <p className="text-sm text-gray-500 mt-1">Switch roles to focus on Learning, AI Insights, or Paper Trading. All features remain accessible.</p>
          </div>
          <div className="p-6">
            {xpLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading your experience workspace...</span>
              </div>
            ) : xpError ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-red-800 font-semibold mb-2">Unable to Load Experience Data</h3>
                <p className="text-red-700 text-sm">
                  Error: {xpError}
                </p>
                <p className="text-red-600 text-sm mt-2">
                  Please ensure you are logged in and the backend is running.
                </p>
              </div>
            ) : !userRole ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="text-yellow-800 font-semibold mb-2">Invalid User Role</h3>
                <p className="text-yellow-700 text-sm">
                  Unable to determine your experience level from: {xpProgress?.current_role || 'undefined'}
                </p>
                <p className="text-yellow-600 text-sm mt-2">
                  Please contact support or check your account settings.
                </p>
              </div>
            ) : (
              <RoleBasedFeatures 
                currentRole={userRole}
                selectedStock={selectedStock ? {
                  symbol: selectedStock.symbol,
                  name: selectedStock.name,
                  price: getStock(selectedStock.symbol)?.price || selectedStock.price
                } : undefined}
              >
                {selectedStock ? (
                  <PaperTrade
                    symbol={selectedStock.symbol}
                    companyName={selectedStock.name}
                    currentPrice={getStock(selectedStock.symbol)?.price || selectedStock.price}
                    onTradeExecuted={(tradeDetails) => {
                      console.log('Trade executed:', tradeDetails)
                    }}
                    className=""
                  />
                ) : (
                  <div className="bg-gray-50 border rounded-md p-4 text-sm text-gray-600">
                    Select a stock above to begin paper trading and receive AI coaching after each trade.
                  </div>
                )}
              </RoleBasedFeatures>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
