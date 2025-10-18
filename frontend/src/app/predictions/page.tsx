'use client'

import Layout from '@/components/Layout'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChartBarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { PredictionsService, PredictionRequest, PredictionResponse } from '@/lib/services/predictions'
import { SearchResult } from '@/lib/services/stocks'
import StockChart from '@/components/StockChart'
import StockSearchDropdown from '@/components/ui/StockSearchDropdown'
import AIInsight from '@/components/ai/AIInsight'

function PredictionsContent() {
  const searchParams = useSearchParams()
  const [symbol, setSymbol] = useState('')
  const [selectedStock, setSelectedStock] = useState<SearchResult | null>(null)
  const [modelType, setModelType] = useState('lstm')
  const [predictionDays, setPredictionDays] = useState(30)
  const confidenceLevel = 0.95 // Fixed at 95% - industry standard
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleStockSelect = (stock: SearchResult) => {
    setSelectedStock(stock)
    setSymbol(stock.symbol)
  }

  const clearSelection = () => {
    setSelectedStock(null)
    setSymbol('')
  }

  // Handle URL parameters
  useEffect(() => {
    const symbolParam = searchParams.get('symbol')
    if (symbolParam) {
      setSymbol(symbolParam.toUpperCase())
      // Create a mock selected stock for the URL parameter
      setSelectedStock({
        symbol: symbolParam.toUpperCase(),
        name: symbolParam.toUpperCase() // We'll use the symbol as name for now
      })
    }
  }, [searchParams])

  // Helper function to map frontend model names to backend model names
  const mapToBackendModelName = (frontendName: string): string => {
    const modelNameMap: Record<string, string> = {
      'lstm': 'LSTM',
      'arima': 'ARIMA',
      'random_forest': 'Random Forest',
      'xgboost': 'XGBoost',
      'svr': 'SVR',
    }
    return modelNameMap[frontendName] || frontendName
  }

  // Helper function to get model result from prediction response
  const getModelResult = (prediction: any, frontendModelName: string) => {
    if (!prediction?.results) return null
    
    const backendModelName = mapToBackendModelName(frontendModelName)
    
    // Try backend model name first
    if (prediction.results[backendModelName]) {
      return prediction.results[backendModelName]
    }
    
    // Fallback to frontend model name
    if (prediction.results[frontendModelName]) {
      return prediction.results[frontendModelName]
    }
    
    // Fallback to first available result
    const firstKey = Object.keys(prediction.results)[0]
    return firstKey ? prediction.results[firstKey] : null
  }

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
      console.log('Received prediction data:', data)
      console.log('Model type:', modelType, 'Backend model name:', mapToBackendModelName(modelType))
      console.log('Available results:', Object.keys(data.results || {}))
      setPrediction(data)
    } catch (error) {
      console.error('Prediction error:', error)
      setError('Failed to generate prediction. Please check that the backend prediction service is running and try again.')
    } finally {
      setLoading(false)
    }
  }

  const modelOptions = [
    { value: 'lstm', name: 'LSTM Neural Network', description: 'Advanced deep learning model with TensorFlow', status: 'available' },
    { value: 'arima', name: 'ARIMA', description: 'Statistical time series model', status: 'available' },
    { value: 'random_forest', name: 'Random Forest', description: 'Ensemble tree-based model', status: 'available' },
    { value: 'xgboost', name: 'XGBoost', description: 'Gradient boosting model', status: 'available' },
    { value: 'svr', name: 'Support Vector Regression', description: 'SVM-based regression model', status: 'available' },
  ]

  return (
    <Layout>
      <div className="space-y-6">
        {/* Prediction Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Generate Stock Prediction</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StockSearchDropdown
              onSelect={handleStockSelect}
              selectedStock={selectedStock}
              onClear={clearSelection}
              placeholder="Search for a stock (e.g., Apple, Microsoft, Tesla)"
              label="Search Stock"
              maxResults={5}
            />

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Prediction Days
              </label>
              <select
                value={predictionDays}
                onChange={(e) => setPredictionDays(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Model Type
              </label>
              <select
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                {modelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.name} {option.status === 'available' ? '✓' : ''}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-700 mt-1">
                {modelOptions.find(opt => opt.value === modelType)?.description}
                {modelOptions.find(opt => opt.value === modelType)?.status === 'available' && (
                  <span className="text-green-700 font-medium ml-2">• Ready to use</span>
                )}
              </p>
            </div>

          </div>

          <div className="mt-6">
            <button
              onClick={handlePredict}
              disabled={loading}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
            >
              <ChartBarIcon className="w-5 h-5" />
              <span>{loading ? 'Generating Prediction...' : 'Generate Prediction'}</span>
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start space-x-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-800 font-medium">{error}</span>
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
              <p className="text-sm text-gray-700">
                <span className="font-medium">Model:</span> {prediction.model_type} | 
                <span className="font-medium">Confidence:</span> 95% | 
                <span className="font-medium">Generated:</span> {new Date(prediction.metadata?.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="p-6">
              {/* Model Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Accuracy Score</h4>
                  <p className="text-2xl font-bold text-green-600">
                    {((getModelResult(prediction, modelType)?.metadata?.accuracy_score || 0.78) * 100).toFixed(1)}%
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Trend</h4>
                  <p className="text-2xl font-bold text-blue-600 capitalize">
                    {getModelResult(prediction, modelType)?.metadata?.trend || 'Neutral'}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Volatility</h4>
                  <p className="text-2xl font-bold text-yellow-600">
                    {((getModelResult(prediction, modelType)?.metadata?.volatility || 0.025) * 100).toFixed(2)}%
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Last Price</h4>
                  <p className="text-2xl font-bold text-gray-900">
                    ${(getModelResult(prediction, modelType)?.metadata?.last_price || 148.50).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Predictions Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Predicted Price</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Lower Bound</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Upper Bound</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getModelResult(prediction, modelType)?.predictions?.map((pred: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pred.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-700">
                          ${pred.predicted_price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-700">
                          ${pred.lower_bound.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-700">
                          ${pred.upper_bound.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
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

        {/* AI Insights */}
        {prediction && symbol && (
          <AIInsight 
            symbol={symbol.toUpperCase()}
            userRole="beginner"
            className=""
          />
        )}
      </div>
    </Layout>
  )
}

export default function PredictionsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PredictionsContent />
    </Suspense>
  )
}
