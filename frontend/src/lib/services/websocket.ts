import { useCallback, useEffect, useRef, useState } from 'react'

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

  const generateMockUpdate = useCallback((symbol: string): StockUpdate => {
    const basePrices: Record<string, number> = {
      'AAPL': 185.50,
      'GOOGL': 2750.30,
      'GOOG': 2760.15,
      'MSFT': 425.75,
      'TSLA': 245.80,
      'NVDA': 875.40,
      'META': 520.25,
      'AMZN': 3450.80,
      'NFLX': 485.90,
      'SPY': 455.30,
      'QQQ': 390.15,
      'VTI': 265.80
    }

    const basePrice = basePrices[symbol] || 150.00
    const changePercent = (Math.random() - 0.5) * 4 // -2% to +2%
    const change = basePrice * (changePercent / 100)
    const price = basePrice + change

    return {
      symbol,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      timestamp: new Date().toISOString()
    }
  }, [])

  const startMockUpdates = useCallback(() => {
    if (simulationInterval.current) {
      clearInterval(simulationInterval.current)
    }

    simulationInterval.current = setInterval(() => {
      if (subscribedSymbols.current.size > 0) {
        const symbols = Array.from(subscribedSymbols.current)
        const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)]
        const update = generateMockUpdate(randomSymbol)
        
        if (callbacks.onStockUpdate) {
          callbacks.onStockUpdate(update)
        }
      }
    }, 2000) // Update every 2 seconds
  }, [callbacks.onStockUpdate, generateMockUpdate])

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
        startMockUpdates()
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
  }, [callbacks, startMockUpdates])

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
    
    // Send initial update for the new symbol
    setTimeout(() => {
      const update = generateMockUpdate(upperSymbol)
      if (callbacks.onStockUpdate) {
        callbacks.onStockUpdate(update)
      }
    }, 500)
  }, [callbacks.onStockUpdate, generateMockUpdate])

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