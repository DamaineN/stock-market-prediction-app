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
              <div key={i} className="bg-white p-8 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded-md mb-6"></div>
                <div className="h-8 bg-gray-200 rounded-md"></div>
              </div>
            ))}
          </div>
          <div className="bg-white p-8 rounded-lg shadow mb-6">
            <div className="h-6 bg-gray-200 rounded-md mb-6 w-1/4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded-md"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
      <div className="space-y-8">
        {/* Market Overview */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100">
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Live Market Overview</h2>
                <p className="text-sm text-gray-600">Real-time data from your tracked stocks</p>
              </div>
              <ConnectionStatus isConnected={isConnected} error={connectionError} />
            </div>
          </div>
          <div className="p-8">
            <RealTimeStockList stocks={stocks.slice(0, 3)} />
            {stocks.length > 3 && (
              <div className="mt-6 text-center">
                <Link href="/watchlist" className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200">
                  View all tracked stocks 
                  <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </div>


        {/* Recent Predictions */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Recent Predictions</h2>
              <p className="text-sm text-gray-600">Your latest AI-powered stock predictions</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Symbol
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Model
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Prediction
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Confidence
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {predictionsLoading ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                        <p className="text-sm font-medium">Loading predictions...</p>
                      </div>
                    </td>
                  </tr>
                ) : predictionsError ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-red-500">
                      <div className="flex flex-col items-center">
                        <p className="text-lg font-medium mb-2">Error loading predictions</p>
                        <p className="text-sm mb-4 text-red-400">{predictionsError}</p>
                        <button 
                          onClick={refreshPredictions}
                          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors duration-200 font-medium"
                        >
                          Retry
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : predictions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <p className="text-lg font-medium mb-2">No predictions yet</p>
                        <p className="text-sm mb-4 text-gray-400">Create your first stock prediction to see results here</p>
                        <Link href="/predictions" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200">
                          Make Prediction
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  predictions.map((prediction, index) => (
                    <tr key={prediction.id || index} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900 tracking-wide">{prediction.symbol}</span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className="text-sm text-gray-600 font-medium">{prediction.model}</span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">${prediction.prediction ? prediction.prediction.toFixed(2) : prediction.predicted_price ? prediction.predicted_price.toFixed(2) : 'N/A'}</span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          (prediction.confidence || 0) >= 0.7 ? 'text-green-600' : 
                          (prediction.confidence || 0) >= 0.5 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {((prediction.confidence || 0) * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-500 font-medium">
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
          <div className="bg-white p-7 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Prediction</h3>
            <p className="text-sm text-gray-600 mb-5">Get an AI-powered stock prediction instantly</p>
            <Link href="/predictions" className="block">
              <button className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-sm">
                Make Prediction
              </button>
            </Link>
          </div>
          
          <div className="bg-white p-7 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Search Stocks</h3>
            <p className="text-sm text-gray-600 mb-5">Find and analyze stocks with advanced search</p>
            <Link href="/search" className="block">
              <button className="w-full bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium text-sm">
                Search Now
              </button>
            </Link>
          </div>
          
          <div className="bg-white p-7 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">View Watchlist</h3>
            <p className="text-sm text-gray-600 mb-5">Monitor and track your favorite stocks with our watchlist</p>
            <Link href="/watchlist" className="block">
              <button className="w-full bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium text-sm">
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
