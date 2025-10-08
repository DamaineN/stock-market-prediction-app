'use client'

import { useState, useEffect } from 'react'
import { 
  LightBulbIcon, 
  ArrowTrendingUpIcon as TrendingUpIcon, 
  ArrowTrendingDownIcon as TrendingDownIcon,
  MinusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  SparklesIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

interface TechnicalIndicators {
  sma_20: number
  sma_50: number
  price_vs_sma_20: number
  price_vs_sma_50: number
  price_change_1d: number
  price_change_5d: number
  price_change_20d: number
  volatility: number
  rsi: number
  volume_ratio: number
  bollinger_position: number
}

interface ModelPrediction {
  model: string
  predicted_7d: number
  predicted_30d: number
  change_7d: number
  change_30d: number
  accuracy: number
}

export interface AIInsightData {
  symbol: string
  insight_type: 'BUY' | 'SELL' | 'HOLD'
  confidence_score: number
  reasoning: string
  model_predictions: ModelPrediction[]
  technical_indicators: TechnicalIndicators
  market_sentiment: string
  current_price: number
  target_price?: number
  stop_loss_price?: number
  risk_level: string
  time_horizon: string
  created_at: string
  expires_at: string
}

interface AIInsightProps {
  symbol: string
  userRole?: string
  onInsightGenerated?: (insight: AIInsightData) => void
  className?: string
}

export default function AIInsight({ symbol, userRole = 'beginner', onInsightGenerated, className = '' }: AIInsightProps) {
  const [insight, setInsight] = useState<AIInsightData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showTechnicals, setShowTechnicals] = useState(false)

  const generateInsight = async () => {
    if (!symbol) return
    
    setLoading(true)
    setError('')
    
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Authentication required. Please log in.')
      }

      console.log('Generating AI insight for symbol:', symbol)
      
      const response = await fetch('http://localhost:8000/api/v1/insights/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          user_role: userRole
        })
      })

      console.log('AI insight response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.detail || errorData.message || `Server error (${response.status})`
        
        if (response.status === 403) {
          throw new Error('Authentication required. Please log in again.')
        } else if (response.status === 400) {
          throw new Error(`Invalid request: ${errorMessage}`)
        } else {
          throw new Error(`Failed to generate AI insight: ${errorMessage}`)
        }
      }

      const data = await response.json()
      console.log('AI insight data received:', data)
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setInsight(data)
      onInsightGenerated?.(data)
    } catch (error) {
      console.error('Error generating AI insight:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate AI insight. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (symbol) {
      generateInsight()
    }
  }, [symbol, userRole])

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'BUY': return 'text-green-700 bg-green-50 border-green-200'
      case 'SELL': return 'text-red-700 bg-red-50 border-red-200'
      case 'HOLD': return 'text-yellow-700 bg-yellow-50 border-yellow-200'
      default: return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'BUY': return <TrendingUpIcon className="w-6 h-6" />
      case 'SELL': return <TrendingDownIcon className="w-6 h-6" />
      case 'HOLD': return <MinusIcon className="w-6 h-6" />
      default: return <InformationCircleIcon className="w-6 h-6" />
    }
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <SparklesIcon className="w-6 h-6 text-blue-600 animate-pulse" />
          <h3 className="text-lg font-semibold text-gray-900">AI Insight</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Generating AI insight...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <SparklesIcon className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Insight</h3>
        </div>
        <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-md">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
          <span className="text-sm text-red-800">{error}</span>
        </div>
        <button
          onClick={generateInsight}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!insight) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <SparklesIcon className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Insight</h3>
        </div>
        <p className="text-gray-600 text-center py-4">
          Generate predictions first to see AI insights
        </p>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SparklesIcon className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">AI Insight for {insight.symbol}</h3>
          </div>
          <button
            onClick={() => generateInsight()}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Main Recommendation */}
        <div className={`p-4 rounded-lg border-2 ${getRecommendationColor(insight.insight_type)}`}>
          <div className="flex items-center space-x-3 mb-3">
            {getRecommendationIcon(insight.insight_type)}
            <div>
              <h4 className="text-xl font-bold">{insight.insight_type} Recommendation</h4>
              <p className="text-sm opacity-75">
                Confidence: <span className={`font-bold ${getConfidenceColor(insight.confidence_score)}`}>
                  {(insight.confidence_score * 100).toFixed(0)}%
                </span>
              </p>
            </div>
          </div>
          <p className="text-sm leading-relaxed">{insight.reasoning}</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <h5 className="text-xs font-medium text-gray-500 uppercase mb-1">Current Price</h5>
            <p className="text-lg font-bold text-gray-900">${insight.current_price.toFixed(2)}</p>
          </div>
          
          {insight.target_price && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <h5 className="text-xs font-medium text-gray-500 uppercase mb-1">Target Price</h5>
              <p className="text-lg font-bold text-blue-600">${insight.target_price.toFixed(2)}</p>
            </div>
          )}
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <h5 className="text-xs font-medium text-gray-500 uppercase mb-1">Risk Level</h5>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(insight.risk_level)}`}>
              {insight.risk_level.toUpperCase()}
            </span>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <h5 className="text-xs font-medium text-gray-500 uppercase mb-1">Time Horizon</h5>
            <p className="text-lg font-bold text-gray-900 capitalize">{insight.time_horizon}</p>
          </div>
        </div>

        {/* Market Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-2 flex items-center">
              <TrendingUpIcon className="w-4 h-4 mr-1" />
              Market Sentiment
            </h5>
            <p className="text-sm text-gray-700 capitalize">{insight.market_sentiment}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-2 flex items-center">
              <ChartBarIcon className="w-4 h-4 mr-1" />
              Model Agreement
            </h5>
            <p className="text-sm text-gray-700">
              {insight.model_predictions.length} models analyzed
            </p>
          </div>
        </div>

        {/* Model Predictions Summary */}
        <div>
          <h5 className="font-medium text-gray-900 mb-3">Model Predictions (7-day outlook)</h5>
          <div className="space-y-2">
            {insight.model_predictions.slice(0, 3).map((prediction, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-gray-900">{prediction.model}</span>
                  <span className="text-xs text-gray-500">
                    {(prediction.accuracy * 100).toFixed(0)}% accuracy
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${prediction.predicted_7d.toFixed(2)}</p>
                  <p className={`text-xs ${prediction.change_7d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {prediction.change_7d >= 0 ? '+' : ''}{prediction.change_7d.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Analysis Toggle */}
        <div>
          <button
            onClick={() => setShowTechnicals(!showTechnicals)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="font-medium text-gray-900">Technical Analysis</span>
            <span className={`transition-transform ${showTechnicals ? 'rotate-180' : ''}`}>
              ↓
            </span>
          </button>
          
          {showTechnicals && (
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg">
              <div>
                <h6 className="text-xs font-medium text-gray-500 uppercase">RSI</h6>
                <p className="font-bold">{insight.technical_indicators.rsi.toFixed(1)}</p>
              </div>
              <div>
                <h6 className="text-xs font-medium text-gray-500 uppercase">vs SMA 20</h6>
                <p className={`font-bold ${insight.technical_indicators.price_vs_sma_20 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {insight.technical_indicators.price_vs_sma_20.toFixed(1)}%
                </p>
              </div>
              <div>
                <h6 className="text-xs font-medium text-gray-500 uppercase">Volatility</h6>
                <p className="font-bold">{insight.technical_indicators.volatility.toFixed(1)}%</p>
              </div>
              <div>
                <h6 className="text-xs font-medium text-gray-500 uppercase">1D Change</h6>
                <p className={`font-bold ${insight.technical_indicators.price_change_1d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {insight.technical_indicators.price_change_1d.toFixed(1)}%
                </p>
              </div>
              <div>
                <h6 className="text-xs font-medium text-gray-500 uppercase">Volume Ratio</h6>
                <p className="font-bold">{insight.technical_indicators.volume_ratio.toFixed(1)}x</p>
              </div>
              <div>
                <h6 className="text-xs font-medium text-gray-500 uppercase">Bollinger</h6>
                <p className="font-bold">{(insight.technical_indicators.bollinger_position * 100).toFixed(0)}%</p>
              </div>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className="text-xs text-gray-500 flex items-center justify-between">
          <span>Generated: {new Date(insight.created_at).toLocaleString()}</span>
          <span>Expires: {new Date(insight.expires_at).toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}