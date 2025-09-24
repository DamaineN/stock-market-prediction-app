'use client'

import { useState } from 'react'
import { AuthService } from '@/lib/services/auth'

export default function TestApiPage() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testLogin = async () => {
    setLoading(true)
    setResult('')
    
    try {
      const response = await AuthService.login({
        email: 'user@test.com',
        password: 'Test123!'
      })
      setResult(`Success! Token: ${response.access_token.substring(0, 50)}...`)
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error('Detailed error:', error)
    } finally {
      setLoading(false)
    }
  }

  const testHealth = async () => {
    setLoading(true)
    setResult('')
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/health')
      const data = await response.json()
      setResult(`Health check: ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      setResult(`Health error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error('Health check error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">API Test Page</h1>
        
        <div className="space-y-4 mb-6">
          <button
            onClick={testHealth}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Test Health Endpoint
          </button>
          
          <button
            onClick={testLogin}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 ml-4"
          >
            Test Login (user@test.com)
          </button>
        </div>
        
        {loading && <p>Loading...</p>}
        
        {result && (
          <div className="bg-white p-4 rounded border">
            <h2 className="font-bold mb-2">Result:</h2>
            <pre className="text-sm text-gray-800 whitespace-pre-wrap">{result}</pre>
          </div>
        )}
        
        <div className="mt-6">
          <a href="/login" className="text-blue-600 hover:underline">← Back to Login</a>
        </div>
      </div>
    </div>
  )
}
