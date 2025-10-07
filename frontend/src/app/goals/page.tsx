'use client'

import Layout from '@/components/Layout'
import { useState, useEffect } from 'react'
import { 
  TrophyIcon, 
  StarIcon, 
  FireIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowUpIcon,
  GiftIcon
} from '@heroicons/react/24/outline'
import { 
  TrophyIcon as TrophySolid,
  StarIcon as StarSolid 
} from '@heroicons/react/24/solid'
import { useAuth } from '@/contexts/AuthContext'

interface UserGoal {
  id: string
  goal_name: string
  goal_description: string
  current_progress: number
  target_value: number
  progress_percentage: number
  xp_reward: number
  bonus_xp_reward: number
  status: 'active' | 'completed' | 'expired'
  is_recurring: boolean
  completed_date?: string
  created_at: string
}

interface XPActivity {
  id: string
  activity_type: string
  description: string
  xp_earned: number
  earned_at: string
}

interface UserProgress {
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
export default function GoalsPage() {
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [xpActivities, setXpActivities] = useState<XPActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dailyCheckinLoading, setDailyCheckinLoading] = useState(false)
  const [dailyCheckinComplete, setDailyCheckinComplete] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    loadUserProgress()
    loadXPActivities()
    checkDailyCheckin()
  }, [])

  const loadUserProgress = async () => {
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

      if (response.ok) {
        const data = await response.json()
        setUserProgress(data)
      } else {
        throw new Error('Failed to load progress')
      }
    } catch (error) {
      console.error('Error loading user progress:', error)
      setError('Failed to load progress data')
    } finally {
      setLoading(false)
    }
  }

  const loadXPActivities = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        return // Skip if no token, don't show error for optional data
      }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/v1/xp/xp-activities?limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const data = await response.json()
        setXpActivities(data.activities)
      }
    } catch (error) {
      console.error('Error loading XP activities:', error)
    }
  }

  const checkDailyCheckin = () => {
    const lastCheckin = localStorage.getItem('lastDailyCheckin')
    const today = new Date().toDateString()
    setDailyCheckinComplete(lastCheckin === today)
  }

  const handleDailyCheckin = async () => {
    if (dailyCheckinComplete) return

    setDailyCheckinLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('No authentication token found')
      }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/v1/xp/daily-checkin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.xp_earned > 0) {
          setDailyCheckinComplete(true)
          localStorage.setItem('lastDailyCheckin', new Date().toDateString())
          await loadUserProgress()
          
          // Show success message
          alert(`Daily check-in complete! You earned ${data.xp_earned} XP!`)
        }
      }
    } catch (error) {
      console.error('Error with daily checkin:', error)
    } finally {
      setDailyCheckinLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'beginner':
        return <StarIcon className="w-6 h-6 text-yellow-500" />
      case 'casual':
        return <StarSolid className="w-6 h-6 text-blue-500" />
      case 'paper_trader':
        return <TrophySolid className="w-6 h-6 text-purple-500" />
      default:
        return <StarIcon className="w-6 h-6 text-gray-500" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'beginner':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'casual':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'paper_trader':
        return 'text-purple-600 bg-purple-50 border-purple-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'prediction_used':
        return <TrophyIcon className="w-4 h-4 text-blue-500" />
      case 'stock_added_watchlist':
        return <StarIcon className="w-4 h-4 text-green-500" />
      case 'daily_login':
        return <FireIcon className="w-4 h-4 text-orange-500" />
      default:
        return <GiftIcon className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading your progress...</span>
        </div>
      </Layout>
    )
  }

  if (!userProgress) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Failed to load progress data.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">XP Progress</h1>
              <p className="text-gray-600">Earn XP through natural usage of the platform</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Daily Check-in Button */}
              <button
                onClick={handleDailyCheckin}
                disabled={dailyCheckinComplete || dailyCheckinLoading}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium ${
                  dailyCheckinComplete
                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50`}
              >
                {dailyCheckinLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : dailyCheckinComplete ? (
                  <CheckCircleIcon className="w-4 h-4" />
                ) : (
                  <FireIcon className="w-4 h-4" />
                )}
                <span>
                  {dailyCheckinComplete ? 'Checked In!' : 'Daily Check-in'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Current Role & XP Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Role */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-4">
              {getRoleIcon(userProgress.current_role)}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Current Role</h3>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(userProgress.current_role)}`}>
                  {userProgress.current_role.charAt(0).toUpperCase() + userProgress.current_role.slice(1)}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <StarIcon className="w-5 h-5 text-yellow-500" />
              <span className="text-2xl font-bold text-gray-900">{userProgress.total_xp}</span>
              <span className="text-gray-500">Total XP</span>
            </div>
          </div>

          {/* Next Role Progress */}
          {userProgress.next_role && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Next Role Progress</h3>
                <ArrowUpIcon className="w-5 h-5 text-green-500" />
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress to {userProgress.next_role.next_role}</span>
                  <span>{userProgress.next_role.remaining_xp} XP remaining</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${userProgress.next_role.progress_percentage}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {userProgress.next_role.current_xp} / {userProgress.next_role.required_xp} XP
              </p>
            </div>
          )}
        </div>

        {/* How to Earn XP */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">How to Earn XP</h2>
            <p className="text-sm text-gray-600">Earn XP through natural usage of the platform</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <TrophyIcon className="w-6 h-6 text-blue-500" />
                <div>
                  <div className="font-medium text-gray-900">Make Predictions</div>
                  <div className="text-sm text-gray-600">+25 XP per prediction</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <StarIcon className="w-6 h-6 text-green-500" />
                <div>
                  <div className="font-medium text-gray-900">Add to Watchlist</div>
                  <div className="text-sm text-gray-600">+15 XP per stock added</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                <FireIcon className="w-6 h-6 text-orange-500" />
                <div>
                  <div className="font-medium text-gray-900">Daily Check-in</div>
                  <div className="text-sm text-gray-600">+10 XP per day</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                <GiftIcon className="w-6 h-6 text-purple-500" />
                <div>
                  <div className="font-medium text-gray-900">View AI Insights</div>
                  <div className="text-sm text-gray-600">+20 XP per insight</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent XP Activities</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {(xpActivities.length > 0 ? xpActivities : userProgress.recent_activities).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    {getActivityIcon(activity.activity_type)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.earned_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-green-600">
                    +{activity.xp_earned} XP
                  </div>
                </div>
              ))}
              
              {userProgress.recent_activities.length === 0 && xpActivities.length === 0 && (
                <p className="text-center text-gray-500 py-4">No recent activities</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}