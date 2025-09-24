import React from 'react'
import { RealTimeStock } from '@/hooks/useRealTimeStocks'

interface RealTimeStockPriceProps {
  stock: RealTimeStock
  showSymbol?: boolean
  className?: string
}

export function RealTimeStockPrice({ 
  stock, 
  showSymbol = true, 
  className = '' 
}: RealTimeStockPriceProps) {
  const isPositive = stock.change >= 0
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600'
  const bgColor = isPositive ? 'bg-green-50' : 'bg-red-50'

  const formatPrice = (price: number) => {
    return price.toFixed(2)
  }

  const formatChange = (change: number, changePercent: number) => {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  return (
    <div className={`rounded-lg p-3 ${bgColor} ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          {showSymbol && (
            <div className="font-semibold text-lg text-gray-900">
              {stock.symbol}
            </div>
          )}
          <div className="text-2xl font-bold text-gray-900">
            ${formatPrice(stock.price)}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-semibold ${changeColor}`}>
            {formatChange(stock.change, stock.changePercent)}
          </div>
          <div className="text-xs text-gray-500">
            {formatTime(stock.lastUpdate)}
          </div>
        </div>
      </div>
    </div>
  )
}

interface RealTimeStockListProps {
  stocks: RealTimeStock[]
  className?: string
}

export function RealTimeStockList({ stocks, className = '' }: RealTimeStockListProps) {
  if (stocks.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        No stocks being tracked
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {stocks.map((stock) => (
        <RealTimeStockPrice 
          key={stock.symbol} 
          stock={stock} 
        />
      ))}
    </div>
  )
}

interface ConnectionStatusProps {
  isConnected: boolean
  error?: string | null
  className?: string
}

export function ConnectionStatus({ isConnected, error, className = '' }: ConnectionStatusProps) {
  if (error) {
    return (
      <div className={`flex items-center gap-2 text-red-600 ${className}`}>
        <div className="w-2 h-2 rounded-full bg-red-600"></div>
        <span className="text-sm">{error}</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${
        isConnected ? 'bg-green-500' : 'bg-gray-400'
      }`}></div>
      <span className="text-sm text-gray-600">
        {isConnected ? 'Live updates' : 'Connecting...'}
      </span>
    </div>
  )
}