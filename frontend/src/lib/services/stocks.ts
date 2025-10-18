const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Stock data types
export interface StockData {
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface StockDataResponse {
  symbol: string
  data: StockData[]
  metadata: {
    period: string
    interval: string
    count: number
    last_updated: string
    source: string
  }
}

export interface StockInfo {
  symbol: string
  name: string
  sector?: string
  industry?: string
  market_cap?: number
  price?: number
}

export interface SearchResult {
  symbol: string
  name: string
  type: string
  region: string
  marketOpen: string
  marketClose: string
  timezone: string
  currency: string
}

export interface SearchResponse {
  query: string
  results: SearchResult[]
  count: number
}

export interface TechnicalIndicatorResponse {
  symbol: string
  indicator: string
  time_period: number
  series_type: string
  data: Array<{
    timestamp: string
    value: number
  }>
  metadata: {
    count: number
    last_updated: string
    source: string
  }
}

// Stocks API service
export class StocksService {
  static async getHistoricalData(
    symbol: string,
    period: string = '1y',
    interval: string = '1d'
  ): Promise<StockDataResponse> {
    const response = await fetch(`${API_URL}/api/v1/stocks/${symbol.toUpperCase()}/historical?period=${period}&interval=${interval}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch historical data')
    }
    
    return await response.json()
  }

  static async getStockInfo(symbol: string): Promise<StockInfo> {
    const response = await fetch(`${API_URL}/api/v1/stocks/${symbol.toUpperCase()}/info`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch stock info')
    }
    
    return await response.json()
  }

  static async getIntradayData(
    symbol: string,
    interval: string = '5min',
    outputsize: string = 'compact'
  ): Promise<StockDataResponse> {
    const response = await fetch(`${API_URL}/api/v1/stocks/${symbol.toUpperCase()}/intraday?interval=${interval}&outputsize=${outputsize}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch intraday data')
    }
    
    return await response.json()
  }

  static async getTechnicalIndicators(
    symbol: string,
    indicator: string,
    timePeriod: number = 20,
    seriesType: string = 'close'
  ): Promise<TechnicalIndicatorResponse> {
    const response = await fetch(`${API_URL}/api/v1/stocks/${symbol.toUpperCase()}/technical-indicators?indicator=${indicator.toUpperCase()}&time_period=${timePeriod}&series_type=${seriesType}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch technical indicators')
    }
    
    return await response.json()
  }

  static async searchStocks(query: string, limit: number = 10): Promise<SearchResponse> {
    const response = await fetch(`${API_URL}/api/v1/stocks/search?query=${encodeURIComponent(query)}&limit=${limit}`)
    
    if (!response.ok) {
      throw new Error('Failed to search stocks')
    }
    
    return await response.json()
  }

  // Helper method to get common technical indicators
  static async getCommonIndicators(symbol: string) {
    try {
      const [sma, ema, rsi] = await Promise.allSettled([
        this.getTechnicalIndicators(symbol, 'SMA', 20),
        this.getTechnicalIndicators(symbol, 'EMA', 20),
        this.getTechnicalIndicators(symbol, 'RSI', 14)
      ])

      return {
        sma: sma.status === 'fulfilled' ? sma.value : null,
        ema: ema.status === 'fulfilled' ? ema.value : null,
        rsi: rsi.status === 'fulfilled' ? rsi.value : null
      }
    } catch (error) {
      console.error('Error fetching technical indicators:', error)
      return { sma: null, ema: null, rsi: null }
    }
  }

  // Helper method to format stock data for charts
  static formatChartData(stockData: StockData[]): Array<{
    date: string
    price: number
    volume: number
  }> {
    if (!stockData || !Array.isArray(stockData) || stockData.length === 0) {
      console.warn('Invalid or empty stockData provided to formatChartData')
      return []
    }
    
    return stockData.map((data, index) => {
      // Validate data structure
      if (!data || typeof data !== 'object') {
        console.warn(`Invalid data object at index ${index}:`, data)
        data = { timestamp: null, close: 0, volume: 0 } // Use fallback
      }
      
      let dateString: string
      
      try {
        // Handle various timestamp formats
        let dateObj: Date
        
        if (!data.timestamp) {
          // Fallback: use index-based date (going backwards from today)
          dateObj = new Date(Date.now() - (stockData.length - index - 1) * 24 * 60 * 60 * 1000)
        } else if (typeof data.timestamp === 'string') {
          // Try parsing string timestamp
          dateObj = new Date(data.timestamp)
        } else if (typeof data.timestamp === 'number') {
          // Handle Unix timestamp (seconds or milliseconds)
          const timestamp = data.timestamp > 1000000000000 ? data.timestamp : data.timestamp * 1000
          dateObj = new Date(timestamp)
        } else {
          // Already a Date object
          dateObj = new Date(data.timestamp)
        }
        
        // Validate the date
        if (isNaN(dateObj.getTime())) {
          throw new Error('Invalid date')
        }
        
        dateString = dateObj.toISOString().split('T')[0]
      } catch (error) {
        console.warn(`Invalid timestamp for data point ${index}:`, data.timestamp, error)
        // Fallback to index-based date
        const fallbackDate = new Date(Date.now() - (stockData.length - index - 1) * 24 * 60 * 60 * 1000)
        dateString = fallbackDate.toISOString().split('T')[0]
      }
      
      return {
        date: dateString,
        price: data.close || 0,
        volume: data.volume || 0
      }
    })
  }

  // Helper method to calculate basic statistics
  static calculateStats(stockData: StockData[]) {
    if (!stockData.length) return null

    const prices = stockData.map(d => d.close)
    const volumes = stockData.map(d => d.volume)
    
    const currentPrice = prices[prices.length - 1]
    const previousPrice = prices[prices.length - 2]
    const change = currentPrice - previousPrice
    const changePercent = (change / previousPrice) * 100

    const high52Week = Math.max(...prices)
    const low52Week = Math.min(...prices)
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length

    return {
      currentPrice,
      change,
      changePercent,
      high52Week,
      low52Week,
      avgVolume
    }
  }
}