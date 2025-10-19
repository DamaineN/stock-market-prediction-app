import { useCallback, useEffect, useRef, useState } from 'react'
import { StocksService } from './stocks'

const WS_URL = process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws') || 'ws://localhost:8000'

export interface StockUpdate {
  symbol: string
  price: number
  change: number
  changePercent: number
  timestamp: string
}

export interface WebSocketCallbacks {
  onConnect?: () => void
  onDisconnect?: () => void
  onStockUpdate?: (update: StockUpdate) => void
  onError?: (error: Event) => void
}

export function useStockWebSocket(callbacks: WebSocketCallbacks) {
  const wsRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const subscribedSymbols = useRef<Set<string>>(new Set())
  const reconnectInterval = useRef<NodeJS.Timeout>()
  const simulationInterval = useRef<NodeJS.Timeout>()

  // Cache for historical data to avoid repeated API calls
  const historicalDataCache = useRef<Record<string, any[]>>({})
  const lastPriceCache = useRef<Record<string, number>>({})

  const generateDatasetUpdate = useCallback(async (symbol: string): Promise<StockUpdate> => {
    try {
      // Check cache first
      let historicalData = historicalDataCache.current[symbol]
      
      if (!historicalData) {
        // Fetch historical data from your datasets
        const response = await StocksService.getHistoricalData(symbol, '1mo', '1d')
        historicalData = response.data
        historicalDataCache.current[symbol] = historicalData
      }
      
      if (historicalData && historicalData.length > 0) {
        // Get the latest data point
        const latestData = historicalData[historicalData.length - 1]
        const previousData = historicalData.length > 1 ? historicalData[historicalData.length - 2] : latestData
        
        const currentPrice = latestData.close
        const previousPrice = previousData.close
        const change = currentPrice - previousPrice
        const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0
        
        // Add small random variation to simulate "live" updates (±0.2%)
        const variation = (Math.random() - 0.5) * 0.004 // ±0.2%
        const simulatedPrice = currentPrice * (1 + variation)
        const simulatedChange = change + (simulatedPrice - currentPrice)
        const simulatedChangePercent = previousPrice > 0 ? (simulatedChange / previousPrice) * 100 : 0
        
        // Store last known price for consistency
        lastPriceCache.current[symbol] = simulatedPrice
        
        return {
          symbol,
          price: Math.round(simulatedPrice * 100) / 100,
          change: Math.round(simulatedChange * 100) / 100,
          changePercent: Math.round(simulatedChangePercent * 100) / 100,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error)
    }
    
    // Fallback to mock data if historical data fails
    const fallbackPrices: Record<string, number> = {
      'AAPL': 252.29, 'GOOGL': 253.30, 'MSFT': 513.58, 'TSLA': 439.31,
      'AMZN': 213.04, 'META': 716.92, 'NVDA': 183.22, 'NFLX': 291.31,
      'TSMC': 492.42, 'SPY': 492.42
    }
    
    const basePrice = lastPriceCache.current[symbol] || fallbackPrices[symbol] || 150.00
    const changePercent = (Math.random() - 0.5) * 0.4 // ±0.2% for fallback
    const change = basePrice * (changePercent / 100)
    const price = basePrice + change
    
    lastPriceCache.current[symbol] = price
    
    return {
      symbol,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      timestamp: new Date().toISOString()
    }
  }, [])

  const startDatasetUpdates = useCallback(() => {
    if (simulationInterval.current) {
      clearInterval(simulationInterval.current)
    }

    // Update all subscribed symbols every 5 minutes
    simulationInterval.current = setInterval(async () => {
      if (subscribedSymbols.current.size > 0) {
        const symbols = Array.from(subscribedSymbols.current)
        
        // Update all symbols, but stagger them slightly to avoid overwhelming the UI
        for (let i = 0; i < symbols.length; i++) {
          setTimeout(async () => {
            try {
              const update = await generateDatasetUpdate(symbols[i])
              if (callbacks.onStockUpdate) {
                callbacks.onStockUpdate(update)
              }
            } catch (error) {
              console.error(`Error updating ${symbols[i]}:`, error)
            }
          }, i * 200) // Stagger by 200ms each
        }
      }
    }, 120000) // Update every 2 minutes (120,000 ms) for more realistic feel

    // Also do an immediate update when starting
    setTimeout(async () => {
      if (subscribedSymbols.current.size > 0) {
        const symbols = Array.from(subscribedSymbols.current)
        for (const symbol of symbols) {
          try {
            const update = await generateDatasetUpdate(symbol)
            if (callbacks.onStockUpdate) {
              callbacks.onStockUpdate(update)
            }
          } catch (error) {
            console.error(`Error updating ${symbol}:`, error)
          }
        }
      }
    }, 1000)
  }, [callbacks.onStockUpdate, generateDatasetUpdate])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      // For now, we'll simulate the connection since we don't have a real WebSocket server
      setTimeout(() => {
        setIsConnected(true)
        if (callbacks.onConnect) {
          callbacks.onConnect()
        }
        startDatasetUpdates()
      }, 1000)
    } catch (error) {
      console.error('WebSocket connection failed:', error)
      if (callbacks.onError) {
        callbacks.onError(error as Event)
      }
      
      // Retry connection
      reconnectInterval.current = setTimeout(() => {
        connect()
      }, 5000)
    }
    }, [callbacks, startDatasetUpdates])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    if (reconnectInterval.current) {
      clearTimeout(reconnectInterval.current)
    }

    if (simulationInterval.current) {
      clearInterval(simulationInterval.current)
    }

    setIsConnected(false)
    if (callbacks.onDisconnect) {
      callbacks.onDisconnect()
    }
  }, [callbacks])

  const subscribe = useCallback((symbol: string) => {
    const upperSymbol = symbol.toUpperCase()
    subscribedSymbols.current.add(upperSymbol)
    
    // Send initial update for the new symbol using historical data
    setTimeout(async () => {
      try {
        const update = await generateDatasetUpdate(upperSymbol)
        if (callbacks.onStockUpdate) {
          callbacks.onStockUpdate(update)
        }
      } catch (error) {
        console.error(`Error getting initial data for ${upperSymbol}:`, error)
      }
    }, 500)
  }, [callbacks.onStockUpdate, generateDatasetUpdate])

  const unsubscribe = useCallback((symbol: string) => {
    const upperSymbol = symbol.toUpperCase()
    subscribedSymbols.current.delete(upperSymbol)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    isConnected
  }
}