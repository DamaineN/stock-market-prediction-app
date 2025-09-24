'use client'

import React from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const Fallback = this.props.fallback
        return <Fallback error={this.state.error} resetError={this.resetError} />
      }

      // Default error UI
      return (
        <div className="min-h-64 flex items-center justify-center bg-red-50 rounded-lg p-6">
          <div className="text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
            <p className="text-red-600 mb-4 max-w-md">
              {this.state.error.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={this.resetError}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

// Custom error fallback components
export function ChartErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <div className="text-center">
        <ExclamationTriangleIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-sm font-medium text-gray-900 mb-1">Chart failed to load</h3>
        <p className="text-xs text-gray-500 mb-3">{error.message}</p>
        <button
          onClick={resetError}
          className="text-xs px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Retry
        </button>
      </div>
    </div>
  )
}

export function ApiErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start">
        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">API Error</h3>
          <p className="text-xs text-yellow-700 mt-1">{error.message}</p>
          <button
            onClick={resetError}
            className="text-xs mt-2 px-2 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  )
}