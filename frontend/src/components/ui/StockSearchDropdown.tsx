'use client'

import { useState, useRef, useEffect } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { StocksService, SearchResult } from '@/lib/services/stocks'

interface StockSearchDropdownProps {
  onSelect: (stock: SearchResult) => void
  placeholder?: string
  label?: string
  selectedStock?: SearchResult | null
  onClear?: () => void
  className?: string
  maxResults?: number
  showFullSearch?: boolean // If true, shows a search button
}

export default function StockSearchDropdown({
  onSelect,
  placeholder = "Search stocks (AAPL, MSFT, TSLA, etc.) - 10 stocks available",
  label = "Search Stock",
  selectedStock = null,
  onClear,
  className = "",
  maxResults = 5,
  showFullSearch = false
}: StockSearchDropdownProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [fullSearchMode, setFullSearchMode] = useState(false)
  
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load all available stocks (for dropdown behavior)
  const loadAllStocks = async () => {
    setSearchLoading(true)
    try {
      const response = await StocksService.searchStocks('', 10) // Empty query returns all available stocks
      setSearchResults(response.results)
      setShowResults(true)
    } catch (error) {
      console.error('Failed to load available stocks:', error)
      setSearchResults([])
      setShowResults(false)
    } finally {
      setSearchLoading(false)
    }
  }

  // Auto-search as user types
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      // Show all available stocks when no search term
      await loadAllStocks()
      return
    }
    
    setSearchLoading(true)
    try {
      const response = await StocksService.searchStocks(query, maxResults)
      setSearchResults(response.results)
      setShowResults(true)
    } catch (error) {
      console.error('Search failed:', error)
      // Fallback: still try to load all available stocks
      await loadAllStocks()
    } finally {
      setSearchLoading(false)
    }
  }

  // Handle input change with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm && !selectedStock) {
        handleSearch(searchTerm)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchTerm, selectedStock, maxResults])

  const handleStockSelect = (stock: SearchResult) => {
    setSearchTerm(stock.symbol)
    setShowResults(false)
    onSelect(stock)
  }

  const clearSelection = () => {
    setSearchTerm('')
    setSearchResults([])
    setShowResults(false)
    if (onClear) {
      onClear()
    }
    inputRef.current?.focus()
  }

  const handleFullSearch = () => {
    if (searchTerm.trim()) {
      handleSearch(searchTerm)
      setFullSearchMode(true)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && showFullSearch && !showResults) {
      handleFullSearch()
    }
  }

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-900 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {/* Search Input */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              if (selectedStock && e.target.value !== selectedStock.symbol) {
                // Clear selected stock if user is typing something different
                if (onClear) onClear()
              }
            }}
            onFocus={() => {
              // Show all available stocks when input is focused
              if (!showResults && !searchTerm) {
                loadAllStocks()
              }
            }}
            onKeyPress={handleKeyPress}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 form-input"
          />
          
          {/* Icon/Clear Button */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {selectedStock || searchTerm ? (
              <button
                onClick={clearSelection}
                className="text-gray-400 hover:text-gray-600"
                type="button"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            ) : (
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Full Search Button (optional) */}
        {showFullSearch && (
          <div className="mt-2">
            <button
              onClick={handleFullSearch}
              disabled={searchLoading || !searchTerm.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
              <span>{searchLoading ? 'Searching...' : 'Search Stocks'}</span>
            </button>
          </div>
        )}
      </div>
      
      {/* Selected Stock Display */}
      {selectedStock && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-blue-900">{selectedStock.symbol}</span>
              <span className="text-blue-700 ml-2">{selectedStock.name}</span>
            </div>
            <span className="text-xs text-blue-600">{selectedStock.type} • {selectedStock.region}</span>
          </div>
        </div>
      )}
      
      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {searchLoading ? (
            <div className="px-4 py-3 text-center text-gray-500">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Searching...
              </div>
            </div>
          ) : (
            searchResults.map((stock, index) => (
              <div
                key={`${stock.symbol}-${index}`}
                onClick={() => handleStockSelect(stock)}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">{stock.symbol}</div>
                    <div className="text-sm text-gray-700">{stock.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">{stock.type}</div>
                    <div className="text-xs text-gray-500">{stock.region}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {/* No results message */}
      {showResults && searchResults.length === 0 && !searchLoading && searchTerm && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="px-4 py-3 text-center text-gray-500">
            No stocks found for "{searchTerm}"
          </div>
        </div>
      )}
    </div>
  )
}