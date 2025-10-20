import { useState, useEffect, useCallback } from 'react'

interface DashboardStats {
  total_predictions: number
  model_accuracy: number
  watchlist_items: number
  active_models: number
  recent_predictions: any[]
  activity_summary: any
  last_updated: string
}

interface ActivityStats {
  predictions_made: number
  stocks_watched: number
  last_login: string | null
  activity_streak: {
    current_streak: number
    longest_streak: number
    last_activity: string
  }
  xp_info: {
    total_xp: number
    current_role: string
    active_goals: number
    completed_goals: number
  }
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('access_token')
      if (!token) {
        setError('Please log in to view your dashboard statistics')
        setLoading(false)
        return
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/v1/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          setError('Your session has expired. Please log in again.')
          // Clear invalid token
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        } else {
          const errorText = await response.text()
          throw new Error(`Server error (${response.status}): ${errorText || response.statusText}`)
        }
        return
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
      if (err instanceof Error && err.message.includes('fetch')) {
        setError('Unable to connect to the server. Please check if the backend is running.')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard stats')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const refreshStats = useCallback(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, error, refreshStats }
}

export function useActivityStats() {
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivityStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/v1/dashboard/activity`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setActivityStats(data)
    } catch (err) {
      console.error('Error fetching activity stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to load activity stats')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActivityStats()
  }, [fetchActivityStats])

  const refreshActivityStats = useCallback(() => {
    fetchActivityStats()
  }, [fetchActivityStats])

  return { activityStats, loading, error, refreshActivityStats }
}

export function useDashboardSummary() {
  const [summary, setSummary] = useState<{
    total_predictions: number
    model_accuracy: number
    watchlist_items: number
    active_models: number
    last_updated: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/v1/dashboard/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setSummary(data)
    } catch (err) {
      console.error('Error fetching dashboard summary:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard summary')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  const refreshSummary = useCallback(() => {
    fetchSummary()
  }, [fetchSummary])

  return { summary, loading, error, refreshSummary }
}

export function useRecentPredictions(limit = 10) {
  const [predictions, setPredictions] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPredictions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('access_token')
      if (!token) {
        setError('Please log in to view your predictions')
        setLoading(false)
        return
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/v1/dashboard/predictions/recent?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setPredictions(data.predictions)
      setTotalCount(data.total_count)
    } catch (err) {
      console.error('Error fetching recent predictions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load recent predictions')
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchPredictions()
  }, [fetchPredictions])

  const refreshPredictions = useCallback(() => {
    fetchPredictions()
  }, [fetchPredictions])

  return { predictions, totalCount, loading, error, refreshPredictions }
}