'use client'

import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useState, useEffect } from 'react'
import { useRealTimeStocks } from '@/hooks/useRealTimeStocks'
import { useDashboardSummary, useRecentPredictions } from '@/hooks/useDashboardStats'
import { RealTimeStockList, ConnectionStatus } from '@/components/ui/real-time-stock-price'
import Link from 'next/link'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

export default function Dashboard() {
  // Get real-time dashboard data
  const { summary, loading: summaryLoading, error: summaryError, refreshSummary } = useDashboardSummary()
  const { predictions, totalCount, loading: predictionsLoading, error: predictionsError, refreshPredictions } = useRecentPredictions()
  
  // Initialize real-time stocks with popular symbols
  const watchedSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA']
  const { stocks, isConnected, connectionError, addSymbol, removeSymbol } = useRealTimeStocks(watchedSymbols)

  const isLoading = summaryLoading || predictionsLoading
  const hasError = summaryError || predictionsError
  
  const handleRefresh = () => {
    refreshSummary()
    refreshPredictions()
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
      <div className="space-y-6">
        {/* Market Overview */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Live Market Overview</h2>
              <ConnectionStatus isConnected={isConnected} error={connectionError} />
            </div>
          </div>
          <div className="p-6">
            <RealTimeStockList stocks={stocks.slice(0, 3)} />
            {stocks.length > 3 && (
              <div className="mt-4 text-center">
                <Link href="/watchlist" className="text-blue-600 hover:text-blue-800 text-sm">
                  View all {stocks.length} tracked stocks →
                </Link>
              </div>
            )}
          </div>
        </div>


        {/* Recent Predictions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Predictions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prediction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {predictionsLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                        Loading predictions...
                      </div>
                    </td>
                  </tr>
                ) : predictionsError ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-red-500">
                      <div className="flex flex-col items-center">
                        <p className="text-lg mb-2">Error loading predictions</p>
                        <p className="text-sm mb-4">{predictionsError}</p>
                        <button 
                          onClick={refreshPredictions}
                          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                        >
                          Retry
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : predictions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <p className="text-lg mb-2">No predictions yet</p>
                        <p className="text-sm mb-4">Create your first stock prediction to see results here</p>
                        <Link href="/predictions" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                          Make Prediction
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  predictions.map((prediction, index) => (
                    <tr key={prediction.id || index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{prediction.symbol}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">{prediction.model}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">${prediction.prediction ? prediction.prediction.toFixed(2) : prediction.predicted_price ? prediction.predicted_price.toFixed(2) : 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">{((prediction.confidence || 0) * 100).toFixed(0)}%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {prediction.date ? new Date(prediction.date).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Prediction</h3>
            <p className="text-sm text-gray-500 mb-4">Get a quick stock prediction</p>
            <Link href="/predictions" className="block">
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Make Prediction
              </button>
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Search Stocks</h3>
            <p className="text-sm text-gray-500 mb-4">Find and analyze stocks</p>
            <Link href="/search" className="block">
              <button className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                Search Now
              </button>
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">View Watchlist</h3>
            <p className="text-sm text-gray-500 mb-4">Monitor your favorite stocks</p>
            <Link href="/watchlist" className="block">
              <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">
                View List
              </button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
    </ProtectedRoute>
  )
}
