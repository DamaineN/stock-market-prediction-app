'use client'

import React, { useState, useEffect } from 'react'
import { XMarkIcon, ChartBarIcon, PlusIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { StocksService, StockInfo } from '@/lib/services/stocks'
import { useRealTimeStocks } from '@/hooks/useRealTimeStocks'
import { RealTimeStockPrice } from '@/components/ui/real-time-stock-price'
import StockChart from '@/components/StockChart'
import { WatchlistItem } from '@/lib/services/watchlist'

interface StockDetailModalProps {
  isOpen: boolean
  onClose: () => void
  watchlistItem: WatchlistItem
}

export default function StockDetailModal({ 
  isOpen, 
  onClose, 
  watchlistItem 
}: StockDetailModalProps) {
  const [stockDetails, setStockDetails] = useState<StockInfo | null>(null)
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [chartLoading, setChartLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Real-time data for the selected stock
  const { getStock, addSymbol } = useRealTimeStocks([watchlistItem.symbol])
  const realTimeStock = getStock(watchlistItem.symbol)

  useEffect(() => {
    if (isOpen && watchlistItem.symbol) {
      fetchStockDetails()
    }
  }, [isOpen, watchlistItem.symbol])

  const fetchStockDetails = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Get detailed stock information
      const stockInfo = await StocksService.getStockInfo(watchlistItem.symbol)
      setStockDetails(stockInfo)
      
      // Add to real-time tracking
      addSymbol(watchlistItem.symbol)
      
      // Fetch historical data for chart
      setChartLoading(true)
      try {
        const historical = await StocksService.getHistoricalData(watchlistItem.symbol, '3mo', '1d')
        if (historical.data && historical.data.length > 0) {
          const chartData = StocksService.formatChartData(historical.data)
          setHistoricalData(chartData)
        } else {
          throw new Error('No historical data available')
        }
      } catch (chartError) {
        console.error('Failed to get historical data:', chartError)
      } finally {
        setChartLoading(false)
      }
    } catch (err) {
      console.error('Failed to fetch stock details:', err)
      setError('Failed to load stock details. Please try again.')
    } finally {
      setLoading(false)
    }
  }


  const calculatePriceChange = () => {
    if (!realTimeStock && !watchlistItem) return null
    
    const currentPrice = realTimeStock?.price || watchlistItem.price
    const change = realTimeStock?.change || watchlistItem.change
    const changePercent = realTimeStock?.changePercent || watchlistItem.changePercent
    
    return {
      currentPrice: currentPrice.toFixed(2),
      change: change.toFixed(2),
      changePercent: changePercent.toFixed(2),
      isPositive: change >= 0
    }
  }

  const priceInfo = calculatePriceChange()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 transition-opacity"
          aria-hidden="true" 
          onClick={onClose} 
        />
        
        {/* This element is to trick the browser into centering the modal contents. */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        {/* Modal */}
        <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900">
                {watchlistItem.symbol} - {watchlistItem.name}
              </h3>
              {stockDetails && (
                <p className="text-gray-600 mt-1">
                  {stockDetails.sector} • {stockDetails.industry}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading stock details...</span>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          {!loading && (
            <div className="space-y-6">
              {/* Price Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Current Price</h4>
                  {realTimeStock ? (
                    <RealTimeStockPrice 
                      stock={realTimeStock} 
                      showSymbol={false}
                      className="text-left"
                    />
                  ) : priceInfo ? (
                    <div>
                      <div className="text-3xl font-bold text-gray-900">
                        ${priceInfo.currentPrice}
                      </div>
                      <div className={`text-lg font-medium ${
                        priceInfo.isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {priceInfo.isPositive ? '+' : ''}${priceInfo.change} ({priceInfo.changePercent}%)
                      </div>
                    </div>
                  ) : (
                    <div className="text-3xl font-bold text-gray-900">
                      ${watchlistItem.price.toFixed(2)}
                    </div>
                  )}
                  {realTimeStock && (
                    <div className="flex items-center mt-2 text-sm text-green-600">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" />
                      Live updates
                    </div>
                  )}
                </div>

                {/* Stock Information */}
                {stockDetails && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Company Info</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Market Cap:</span>
                        <span className="text-sm font-medium">
                          ${stockDetails.market_cap ? (stockDetails.market_cap / 1e12).toFixed(2) + 'T' : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Sector:</span>
                        <span className="text-sm font-medium">{stockDetails.sector}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Industry:</span>
                        <span className="text-sm font-medium">{stockDetails.industry}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Stock Chart */}
              {historicalData.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">3-Month Price History</h4>
                  {chartLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Loading chart...</span>
                    </div>
                  ) : (
                    <StockChart
                      historicalData={historicalData}
                      symbol={watchlistItem.symbol}
                      height={300}
                    />
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => {
                    window.location.href = `/predictions?symbol=${watchlistItem.symbol}&name=${encodeURIComponent(watchlistItem.name)}`
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2 transition-colors duration-200"
                >
                  <ChartBarIcon className="w-4 h-4" />
                  <span>Make Prediction</span>
                </button>
                <button 
                  onClick={() => {
                    window.location.href = `/search?symbol=${watchlistItem.symbol}`
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2 transition-colors duration-200"
                >
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  <span>View in Search</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}