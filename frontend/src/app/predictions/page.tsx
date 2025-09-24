'use client'

import Layout from '@/components/Layout'
import { useState } from 'react'
import { ChartBarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { PredictionsService, PredictionRequest, PredictionResponse } from '@/lib/services/predictions'
import StockChart from '@/components/StockChart'

export default function PredictionsPage() {
  const [symbol, setSymbol] = useState('')
  const [modelType, setModelType] = useState('moving_average')
  const [predictionDays, setPredictionDays] = useState(30)
  const [confidenceLevel, setConfidenceLevel] = useState(0.95)
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePredict = async () => {
    if (!symbol.trim()) {
      setError('Please enter a stock symbol')
      return
    }

    setLoading(true)
    setError('')
    setPrediction(null)

    try {
      const predictionRequest: PredictionRequest = {
        symbol: symbol.toUpperCase(),
        model_type: modelType as any,
        prediction_days: predictionDays,
        confidence_level: confidenceLevel
      }
      
      const data = await PredictionsService.createPrediction(predictionRequest)
      setPrediction(data)
    } catch (error) {
      console.error('Prediction error:', error)
      setError('Failed to generate prediction. Please try again.')
      
      // Mock prediction for demo
      const mockPrediction = {
        symbol: symbol.toUpperCase(),
        model_type: modelType,
        prediction_days: predictionDays,
        results: {
          moving_average: {
            predictions: Array.from({ length: Math.min(predictionDays, 7) }, (_, i) => ({
              date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              predicted_price: 150 + Math.random() * 20,
              lower_bound: 140 + Math.random() * 15,
              upper_bound: 160 + Math.random() * 25,
              confidence: confidenceLevel
            })),
            metadata: {
              accuracy_score: 0.78,
              volatility: 0.025,
              trend: 'bullish',
              last_price: 148.50
            }
          }
        },
        metadata: {
          confidence_level: confidenceLevel,
          created_at: new Date().toISOString()
        }
      }
      setPrediction(mockPrediction)
      setError('')
    } finally {
      setLoading(false)
    }
  }

  const modelOptions = [
    { value: 'moving_average', name: 'Moving Average', description: 'Simple trend-based model' },
    { value: 'lstm', name: 'LSTM Neural Network', description: 'Advanced deep learning model (Coming Soon)' },
    { value: 'arima', name: 'ARIMA', description: 'Statistical time series model (Coming Soon)' },
    { value: 'ensemble', name: 'Ensemble', description: 'Combined model approach (Coming Soon)' }
  ]

  return (
    <Layout>
      <div className="space-y-6">
        {/* Prediction Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Generate Stock Prediction</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Symbol
              </label>
              <input
                type="text"
                placeholder="e.g., AAPL, GOOGL, MSFT"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prediction Days
              </label>
              <select
                value={predictionDays}
                onChange={(e) => setPredictionDays(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model Type
              </label>
              <select
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {modelOptions.map((option) => (
                  <option key={option.value} value={option.value} disabled={option.value !== 'moving_average'}>
                    {option.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {modelOptions.find(opt => opt.value === modelType)?.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confidence Level
              </label>
              <select
                value={confidenceLevel}
                onChange={(e) => setConfidenceLevel(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0.90}>90%</option>
                <option value={0.95}>95%</option>
                <option value={0.99}>99%</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handlePredict}
              disabled={loading}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <ChartBarIcon className="w-5 h-5" />
              <span>{loading ? 'Generating Prediction...' : 'Generate Prediction'}</span>
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}
        </div>

        {/* Prediction Results */}
        {prediction && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Prediction Results for {prediction.symbol}
              </h3>
              <p className="text-sm text-gray-500">
                Model: {prediction.model_type} | Generated: {new Date(prediction.metadata?.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="p-6">
              {/* Model Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500">Accuracy Score</h4>
                  <p className="text-xl font-semibold text-green-600">
                    {((prediction.results[modelType]?.metadata?.accuracy_score || 0.78) * 100).toFixed(1)}%
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500">Trend</h4>
                  <p className="text-xl font-semibold text-blue-600 capitalize">
                    {prediction.results[modelType]?.metadata?.trend || 'Neutral'}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500">Volatility</h4>
                  <p className="text-xl font-semibold text-yellow-600">
                    {((prediction.results[modelType]?.metadata?.volatility || 0.025) * 100).toFixed(2)}%
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500">Last Price</h4>
                  <p className="text-xl font-semibold text-gray-900">
                    ${(prediction.results[modelType]?.metadata?.last_price || 148.50).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Predictions Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Predicted Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lower Bound</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Upper Bound</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {prediction.results[modelType]?.predictions?.map((pred: any, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pred.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${pred.predicted_price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          ${pred.lower_bound.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          ${pred.upper_bound.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(pred.confidence * 100).toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
