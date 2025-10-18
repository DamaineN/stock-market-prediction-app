const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

// Prediction types
export interface PredictionRequest {
  symbol: string
  model_type: 'lstm' | 'linear_regression' | 'random_forest' | 'xgboost' | 'all'
  prediction_days: number
  confidence_level: number
}

export interface PredictionData {
  date: string
  predicted_price: number
  confidence_interval_lower: number
  confidence_interval_upper: number
  direction?: 'up' | 'down' | 'neutral'
}

export interface ModelResult {
  status: string
  message?: string
  predictions?: PredictionData[]
  metrics?: {
    accuracy?: number
    mape?: number
    rmse?: number
    mae?: number
  }
  confidence_score?: number
}

export interface PredictionResponse {
  symbol: string
  model_type: string
  prediction_days: number
  results: Record<string, ModelResult>
  metadata: {
    confidence_level: number
    created_at: string
    models_used: string[]
  }
}

export interface CachedPrediction {
  id: string
  symbol: string
  model_type: string
  predictions: PredictionData[]
  created_at: string
  accuracy?: number
}

export interface CachedPredictionsResponse {
  symbol: string
  cached_predictions: CachedPrediction[]
  message: string
  model_type?: string
  limit: number
}

export interface TrainingRequest {
  symbol: string
  model_type: 'lstm' | 'linear_regression' | 'random_forest' | 'xgboost'
  training_period: string
  parameters?: Record<string, any>
}

export interface TrainingResponse {
  message: string
  symbol: string
  model_type: string
  training_period: string
  status: string
  estimated_completion: string
}

export interface ModelStatus {
  status: 'trained' | 'not_trained' | 'training' | 'error'
  last_trained?: string
  accuracy?: number
  error_message?: string
}

export interface ModelStatusResponse {
  models: Record<string, ModelStatus>
  message: string
}

export interface BacktestResult {
  accuracy: number
  total_predictions: number
  correct_predictions: number
  mape: number
  rmse: number
  predictions_vs_actual: Array<{
    date: string
    predicted: number
    actual: number
    error: number
  }>
}

export interface BacktestResponse {
  symbol: string
  model_type: string
  test_period: string
  train_period: string
  results: BacktestResult | { status: string; message: string }
  metadata: {
    created_at: string
  }
}

// Predictions API service
export class PredictionsService {
  // Map frontend model names to backend model names
  private static mapModelName(frontendName: string): string {
    const modelNameMap: Record<string, string> = {
      'lstm': 'LSTM',
      'linear_regression': 'Linear Regression',
      'random_forest': 'Random Forest',
      'xgboost': 'XGBoost',
      'all': 'all'
    }
    return modelNameMap[frontendName] || frontendName
  }
  static async createPrediction(request: PredictionRequest): Promise<PredictionResponse> {
    // Map frontend model name to backend model name
    const mappedRequest = {
      ...request,
      model_type: this.mapModelName(request.model_type)
    }
    
    const response = await fetch(`${API_URL}/api/v1/predictions/predict`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(mappedRequest)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to create prediction')
    }
    
    return await response.json()
  }

  static async getCachedPredictions(
    symbol: string,
    modelType?: string,
    limit: number = 10
  ): Promise<CachedPredictionsResponse> {
    const params = new URLSearchParams({ limit: limit.toString() })
    if (modelType) params.append('model_type', modelType)
    
    const response = await fetch(`${API_URL}/api/v1/predictions/${symbol.toUpperCase()}?${params}`, {
      headers: getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch cached predictions')
    }
    
    return await response.json()
  }

  static async trainModel(request: TrainingRequest): Promise<TrainingResponse> {
    try {
      const response = await apiClient.post('/predictions/train', request)
      return handleApiResponse<TrainingResponse>(response)
    } catch (error) {
      handleApiError(error)
    }
  }

  static async getModelStatus(): Promise<ModelStatusResponse> {
    try {
      const response = await apiClient.get('/predictions/models/status')
      return handleApiResponse<ModelStatusResponse>(response)
    } catch (error) {
      handleApiError(error)
    }
  }

  static async backtestModel(
    symbol: string,
    modelType: string,
    testPeriod: string = '3mo',
    trainPeriod: string = '2y'
  ): Promise<BacktestResponse> {
    try {
      const response = await apiClient.get(`/predictions/backtest/${symbol.toUpperCase()}`, {
        params: {
          model_type: modelType,
          test_period: testPeriod,
          train_period: trainPeriod
        }
      })
      return handleApiResponse<BacktestResponse>(response)
    } catch (error) {
      handleApiError(error)
    }
  }

  // Helper method to format prediction data for charts
  static formatPredictionChartData(predictions: PredictionData[]): Array<{
    date: string
    predicted: number
    lower: number
    upper: number
  }> {
    return predictions.map(pred => ({
      date: new Date(pred.date).toISOString().split('T')[0],
      predicted: pred.predicted_price,
      lower: pred.confidence_interval_lower,
      upper: pred.confidence_interval_upper
    }))
  }

  // Helper method to calculate prediction summary
  static calculatePredictionSummary(predictions: PredictionData[]) {
    if (!predictions.length) return null

    const prices = predictions.map(p => p.predicted_price)
    const firstPrice = prices[0]
    const lastPrice = prices[prices.length - 1]
    
    const totalChange = lastPrice - firstPrice
    const totalChangePercent = (totalChange / firstPrice) * 100

    const upDays = predictions.filter(p => p.direction === 'up').length
    const downDays = predictions.filter(p => p.direction === 'down').length
    const neutralDays = predictions.filter(p => p.direction === 'neutral').length

    const maxPrice = Math.max(...prices)
    const minPrice = Math.min(...prices)

    return {
      firstPrice,
      lastPrice,
      totalChange,
      totalChangePercent,
      upDays,
      downDays,
      neutralDays,
      maxPrice,
      minPrice,
      volatility: this.calculateVolatility(prices)
    }
  }

  // Helper method to calculate volatility
  private static calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0

    const returns = []
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1])
    }

    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length
    
    return Math.sqrt(variance) * Math.sqrt(252) // Annualized volatility
  }

  // Helper method to get model display names
  static getModelDisplayName(modelType: string): string {
    const modelNames: Record<string, string> = {
      'lstm': 'LSTM Neural Network',
      'linear_regression': 'Linear Regression',
      'random_forest': 'Random Forest',
      'xgboost': 'XGBoost',
      'all': 'All Models'
    }
    return modelNames[modelType] || modelType.toUpperCase()
  }

  // Helper method to get confidence level display
  static getConfidenceLevelDisplay(level: number): string {
    return `${(level * 100).toFixed(0)}%`
  }
}