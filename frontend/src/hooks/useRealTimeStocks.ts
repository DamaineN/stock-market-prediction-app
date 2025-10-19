import { useState, useEffect, useCallback } from 'react'
import { StockUpdate, useStockWebSocket } from '@/lib/services/websocket'

export interface RealTimeStock {
  symbol: string
  price: number
  change: number
  changePercent: number
  lastUpdate: string
}

export function useRealTimeStocks(initialSymbols: string[] = []) {
  const [stocks, setStocks] = useState<Record<string, RealTimeStock>>({})
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const handleStockUpdate = useCallback((update: StockUpdate) => {
    setStocks(prev => ({
      ...prev,
      [update.symbol]: {
        symbol: update.symbol,
        price: update.price,
        change: update.change,
        changePercent: update.changePercent,
        lastUpdate: update.timestamp
      }
    }))
  }, [])

  const handleConnect = useCallback(() => {
    setIsConnected(true)
    setConnectionError(null)
    console.log('Connected to real-time stock updates')
  }, [])

  const handleDisconnect = useCallback(() => {
    setIsConnected(false)
    console.log('Disconnected from real-time stock updates')
  }, [])

  const handleError = useCallback((error: Event) => {
    setConnectionError('Connection failed. Retrying...')
    console.error('WebSocket error:', error)
  }, [])

  const { connect, disconnect, subscribe, unsubscribe } = useStockWebSocket({
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    onStockUpdate: handleStockUpdate,
    onError: handleError
  })

  // Get realistic base price for symbol (from historical datasets)
  const getBasePriceForSymbol = useCallback((symbol: string): number => {
    const basePrices: Record<string, number> = {
      'AAPL': 252.29,
      'GOOGL': 253.30,
      'MSFT': 513.58,
      'TSLA': 439.31,
      'AMZN': 213.04,
      'META': 716.92,
      'NVDA': 183.22,
      'NFLX': 291.31,
      'TSMC': 492.42,
      'SPY': 492.42
    }
    return basePrices[symbol] || 150.00
  }, [])

  const addSymbol = useCallback((symbol: string) => {
    const upperSymbol = symbol.toUpperCase()
    
    // Check if already subscribed to avoid duplicate subscriptions
    setStocks(prev => {
      if (!prev[upperSymbol]) {
        console.log(`Adding new symbol: ${upperSymbol}`)
        subscribe(upperSymbol)
        
        const basePrice = getBasePriceForSymbol(upperSymbol)
        return {
          ...prev,
          [upperSymbol]: {
            symbol: upperSymbol,
            price: basePrice,
            change: 0,
            changePercent: 0,
            lastUpdate: new Date().toISOString()
          }
        }
      } else {
        console.log(`Symbol ${upperSymbol} already exists, skipping`)
        return prev
      }
    })
  }, [subscribe, getBasePriceForSymbol])

  const removeSymbol = useCallback((symbol: string) => {
    const upperSymbol = symbol.toUpperCase()
    unsubscribe(upperSymbol)
    
    setStocks(prev => {
      const updated = { ...prev }
      delete updated[upperSymbol]
      return updated
    })
  }, [unsubscribe])

  // Connect on mount and subscribe to initial symbols - only once
  useEffect(() => {
    console.log('useRealTimeStocks: Initializing with symbols:', initialSymbols)
    connect()
    
    // Subscribe to initial symbols only on mount
    initialSymbols.forEach(symbol => {
      const upperSymbol = symbol.toUpperCase()
      console.log(`Initial subscription to: ${upperSymbol}`)
      addSymbol(upperSymbol)
    })

    return () => {
      disconnect()
    }
  }, []) // Deliberately empty - only run on mount

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear any intervals
      if (typeof window !== 'undefined' && (window as any).__stockWebSocketInterval) {
        clearInterval((window as any).__stockWebSocketInterval)
      }
    }
  }, [])

  const getStock = useCallback((symbol: string): RealTimeStock | undefined => {
    return stocks[symbol.toUpperCase()]
  }, [stocks])

  const getAllStocks = useCallback((): RealTimeStock[] => {
    return Object.values(stocks)
  }, [stocks])

  const getStocksBySymbols = useCallback((symbols: string[]): RealTimeStock[] => {
    return symbols
      .map(symbol => stocks[symbol.toUpperCase()])
      .filter(Boolean)
  }, [stocks])

  return {
    stocks: getAllStocks(),
    stocksMap: stocks,
    isConnected,
    connectionError,
    addSymbol,
    removeSymbol,
    getStock,
    getAllStocks,
    getStocksBySymbols
  }
}