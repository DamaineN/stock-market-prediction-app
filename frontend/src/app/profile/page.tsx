'use client'

import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { useActivityStats } from '@/hooks/useDashboardStats'
import { useXPProgress } from '@/hooks/useXPProgress'
import { useRoleSync } from '@/hooks/useRoleSync'
import { UserIcon, EnvelopeIcon, CalendarIcon, ShieldCheckIcon, ArrowPathIcon, TrophyIcon, StarIcon, FireIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { TrophyIcon as TrophySolid, StarIcon as StarSolid } from '@heroicons/react/24/solid'
import { Toast } from '@/components/ui/Toast'
import { ToastType } from '@/components/ui/Toast'

export default function ProfilePage() {
  const { user, refreshUser, forceRefreshUser } = useAuth()
  const { activityStats, loading: activityLoading, error: activityError, refreshActivityStats } = useActivityStats()
  const { xpProgress, loading: xpLoading, error: xpError, refreshXPProgress } = useXPProgress()
  const { syncRole, syncing: roleSyncing, error: roleSyncError } = useRoleSync()
  
  // Get the most accurate role - prioritize XP-calculated role over stored database role
  const getCurrentRole = () => {
    return xpProgress?.current_role || activityStats?.xp_info?.current_role || user?.role || 'beginner'
  }
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
  })
  const [refreshing, setRefreshing] = useState(false)
  const [toasts, setToasts] = useState<Array<{id: string, message: string, type: ToastType}>>([]);

  // Helper functions for role display
  const formatRoleName = (role: string) => {
    if (!role) return 'Unknown'
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
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

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
      })
    }
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      // TODO: Implement profile update API call
      console.log('Updating profile:', formData)
      await refreshUser()
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
      })
    }
    setIsEditing(false)
  }

  const handleRefreshProfile = async () => {
    setRefreshing(true)
    try {
      const success = await forceRefreshUser()
      if (success) {
        console.log('Profile refreshed successfully')
      } else {
        console.log('Profile refresh failed')
      }
    } catch (error) {
      console.error('Error refreshing profile:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const showToast = (message: string, type: ToastType) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const handleSyncRole = async () => {
    try {
      const result = await syncRole()
      if (result && result.success) {
        console.log('Role sync result:', result)
        
        if (result.role_updated) {
          showToast(
            `Role updated from ${formatRoleName(result.previous_role)} to ${formatRoleName(result.new_role)}!`,
            'success'
          )
        } else {
          showToast(
            `Role is already synced: ${formatRoleName(result.current_role)}`,
            'info'
          )
        }
        
        // Refresh user data and XP progress after successful sync
        await refreshUser()
        await refreshXPProgress()
      } else {
        showToast('Failed to sync role. Please try again.', 'error')
      }
    } catch (error) {
      console.error('Error syncing role:', error)
      showToast('Error syncing role. Please try again.', 'error')
    }
  }

  if (!user) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                <UserIcon className="w-12 h-12 text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{user.full_name || 'User'}</h1>
                    <p className="text-gray-600">{user.email}</p>
                  </div>
                  <button
                    onClick={handleRefreshProfile}
                    disabled={refreshing}
                    className="ml-4 p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    title="Refresh profile data"
                  >
                    <ArrowPathIcon className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="flex items-center mt-2 space-x-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <ShieldCheckIcon className="w-4 h-4 mr-1" />
                    <span>{formatRoleName(getCurrentRole())}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="space-x-2">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="flex items-center">
                      <UserIcon className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-gray-900">{user.full_name || 'Not set'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="flex items-center">
                      <EnvelopeIcon className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-gray-900">{user.email}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Role
                  </label>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ShieldCheckIcon className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-gray-900">{formatRoleName(getCurrentRole())}</span>
                      {xpProgress?.current_role && user?.role && xpProgress.current_role !== user.role && (
                        <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          Updated via XP
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleSyncRole}
                      disabled={roleSyncing}
                      className="ml-2 p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      title="Sync role with current XP"
                    >
                      <ArrowTopRightOnSquareIcon className={`w-4 h-4 ${roleSyncing ? 'animate-pulse' : ''}`} />
                    </button>
                  </div>
                  {roleSyncError && (
                    <div className="mt-1 text-xs text-red-500">{roleSyncError}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Status
                  </label>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${user.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-gray-900 capitalize">{user.status}</span>
                    {user.is_verified && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Stats */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Account Activity</h2>
                <button
                  onClick={refreshActivityStats}
                  disabled={activityLoading}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  title="Refresh activity data"
                >
                  <ArrowPathIcon className={`w-5 h-5 ${activityLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            <div className="p-6">
              {activityError ? (
                <div className="text-center text-red-500 py-4">
                  <p>Error loading activity data: {activityError}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {activityLoading ? '...' : activityStats?.predictions_made || 0}
                    </div>
                    <div className="text-sm text-gray-500">Predictions Made</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {activityLoading ? '...' : activityStats?.stocks_watched || 0}
                    </div>
                    <div className="text-sm text-gray-500">Stocks Watched</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {activityLoading ? '...' : (
                        activityStats?.last_login
                          ? new Date(activityStats.last_login).toLocaleDateString()
                          : user?.last_login
                            ? new Date(user.last_login).toLocaleDateString()
                            : 'Never'
                      )}
                    </div>
                    <div className="text-sm text-gray-500">Last Login</div>
                  </div>
                </div>
              )}
              
              {/* XP Progress Summary */}
              {(xpProgress || activityStats?.xp_info) && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-medium text-gray-900 flex items-center">
                      <TrophyIcon className="w-5 h-5 mr-2 text-yellow-500" />
                      XP Progress
                    </h3>
                    <button
                      onClick={refreshXPProgress}
                      disabled={xpLoading}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      title="Refresh XP data"
                    >
                      <ArrowPathIcon className={`w-4 h-4 ${xpLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  
                  {xpError ? (
                    <div className="text-center text-red-500 py-4">
                      <p>Error loading XP data: {xpError}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Current Role & XP */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                          <div className="flex items-center justify-center mb-2">
                            {getRoleIcon(xpProgress?.current_role || activityStats?.xp_info?.current_role || user.role)}
                          </div>
                          <div className="text-lg font-bold text-gray-900">
                            {formatRoleName(xpProgress?.current_role || activityStats?.xp_info?.current_role || user.role)}
                          </div>
                          <div className="text-xs text-gray-600">Current Role</div>
                        </div>
                        
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-center mb-2">
                            <StarIcon className="w-6 h-6 text-blue-500" />
                          </div>
                          <div className="text-lg font-bold text-gray-900">
                            {xpProgress?.total_xp || activityStats?.xp_info?.total_xp || 0}
                          </div>
                          <div className="text-xs text-gray-600">Total XP</div>
                        </div>
                      </div>
                      
                      {/* Role Progress Bar */}
                      {xpProgress?.next_role && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              Progress to {formatRoleName(xpProgress.next_role.next_role)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {xpProgress.next_role.remaining_xp} XP remaining
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(xpProgress.next_role.progress_percentage, 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{xpProgress.next_role.current_xp} XP</span>
                            <span>{xpProgress.next_role.required_xp} XP</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Recent XP Activities */}
                      {xpProgress?.recent_activities && xpProgress.recent_activities.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Recent XP Gains</h4>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {xpProgress.recent_activities.slice(0, 3).map((activity, index) => (
                              <div 
                                key={activity.id || `activity-${index}-${activity.description?.slice(0, 20)}`} 
                                className="flex items-center justify-between py-1 px-2 bg-green-50 rounded text-sm"
                              >
                                <span className="text-gray-700">{activity.description || 'Unknown activity'}</span>
                                <span className="font-semibold text-green-600">+{activity.xp_earned || 0} XP</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Activity Streak */}
              {activityStats?.activity_streak && !activityLoading && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-md font-medium text-gray-900 mb-4">Activity Streak</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-orange-600">
                        {activityStats.activity_streak.current_streak} days
                      </div>
                      <div className="text-xs text-gray-500">Current Streak</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-red-600">
                        {activityStats.activity_streak.longest_streak} days
                      </div>
                      <div className="text-xs text-gray-500">Longest Streak</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Toast notifications */}
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </Layout>
    </ProtectedRoute>
  )
}
