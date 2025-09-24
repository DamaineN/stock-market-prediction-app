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

  const addSymbol = useCallback((symbol: string) => {
    const upperSymbol = symbol.toUpperCase()
    subscribe(upperSymbol)
    
    // Initialize with empty data if not exists
    if (!stocks[upperSymbol]) {
      setStocks(prev => ({
        ...prev,
        [upperSymbol]: {
          symbol: upperSymbol,
          price: 0,
          change: 0,
          changePercent: 0,
          lastUpdate: new Date().toISOString()
        }
      }))
    }
  }, [subscribe, stocks])

  const removeSymbol = useCallback((symbol: string) => {
    const upperSymbol = symbol.toUpperCase()
    unsubscribe(upperSymbol)
    
    setStocks(prev => {
      const updated = { ...prev }
      delete updated[upperSymbol]
      return updated
    })
  }, [unsubscribe])

  // Connect on mount and subscribe to initial symbols
  useEffect(() => {
    connect()
    
    // Subscribe to initial symbols
    initialSymbols.forEach(symbol => {
      addSymbol(symbol)
    })

    return () => {
      disconnect()
    }
  }, [connect, disconnect, addSymbol]) // Only include necessary dependencies

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