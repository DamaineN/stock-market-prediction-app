'use client'

import { useState, useEffect } from 'react'

interface LearningProgress {
  user_id: string
  completed_modules: string[]
  total_modules_completed: number
  total_learning_xp: number
  completion_history: Array<{
    module_id: string
    module_title: string
    xp_earned: number
    completed_at: string
  }>
}

interface CompletionResult {
  success: boolean
  xp_earned: number
  message: string
  new_total_xp: number
  role_changed: boolean
  new_role?: string
  already_completed?: boolean
}

export const useLearningProgress = () => {
  const [learningProgress, setLearningProgress] = useState<LearningProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLearningProgress = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('No authentication token found')
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/v1/xp/learning/progress`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setLearningProgress(data)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Error fetching learning progress:', err)
    } finally {
      setLoading(false)
    }
  }

  const completeModule = async (
    moduleId: string, 
    moduleTitle: string, 
    xpReward: number
  ): Promise<CompletionResult> => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('No authentication token found')
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/v1/xp/learning/complete-module`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          module_id: moduleId,
          module_title: moduleTitle,
          xp_reward: xpReward
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      // Refresh learning progress after successful completion
      if (result.success && !result.already_completed) {
        await fetchLearningProgress()
      }
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Error completing module:', err)
      return {
        success: false,
        xp_earned: 0,
        message: `Error: ${errorMessage}`,
        new_total_xp: 0,
        role_changed: false
      }
    }
  }

  const refreshProgress = () => {
    setLoading(true)
    fetchLearningProgress()
  }

  const isModuleCompleted = (moduleId: string): boolean => {
    return learningProgress?.completed_modules.includes(moduleId) || false
  }

  useEffect(() => {
    fetchLearningProgress()
  }, [])

  return {
    learningProgress,
    loading,
    error,
    completeModule,
    refreshProgress,
    isModuleCompleted
  }
}