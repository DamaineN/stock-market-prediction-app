'use client'

import { useState, useEffect } from 'react'

interface XPActivity {
  id: string
  activity_type: string
  description: string
  xp_earned: number
  earned_at: string
}

interface XPProgress {
  user_id: string
  current_role: string
  total_xp: number
  next_role?: {
    next_role: string
    required_xp: number
    current_xp: number
    remaining_xp: number
    progress_percentage: number
  }
  recent_activities: XPActivity[]
}

export const useXPProgress = () => {
  const [xpProgress, setXpProgress] = useState<XPProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchXPProgress = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('No authentication token found')
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/v1/xp/progress`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setXpProgress(data)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Error fetching XP progress:', err)
    } finally {
      setLoading(false)
    }
  }

  const refreshXPProgress = () => {
    setLoading(true)
    fetchXPProgress()
  }

  useEffect(() => {
    fetchXPProgress()
  }, [])

  return {
    xpProgress,
    loading,
    error,
    refreshXPProgress
  }
}