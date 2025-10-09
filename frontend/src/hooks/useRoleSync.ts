'use client'

import { useState } from 'react'

interface RoleSyncResult {
  success: boolean
  role_updated: boolean
  previous_role?: string
  new_role?: string
  current_role?: string
  current_xp: number
  message: string
}

export const useRoleSync = () => {
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const syncRole = async (): Promise<RoleSyncResult | null> => {
    try {
      setSyncing(true)
      setError(null)
      
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('No authentication token found')
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/v1/xp/sync-role`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Error syncing role:', err)
      return null
    } finally {
      setSyncing(false)
    }
  }

  return {
    syncRole,
    syncing,
    error
  }
}