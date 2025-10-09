'use client'

import React, { useState } from 'react'
import { UserIcon, CheckIcon } from '@heroicons/react/24/outline'

interface ProfilePictureSelectorProps {
  currentPicture?: string | null
  onSelect: (pictureId: string) => void
  onClose: () => void
  isOpen: boolean
}

// Predefined avatar options
const avatarOptions = [
  {
    id: 'default',
    name: 'Default Avatar',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
    icon: UserIcon
  },
  {
    id: 'blue',
    name: 'Blue Avatar',
    bgColor: 'bg-blue-500',
    textColor: 'text-white',
    icon: UserIcon
  },
  {
    id: 'green',
    name: 'Green Avatar', 
    bgColor: 'bg-green-500',
    textColor: 'text-white',
    icon: UserIcon
  },
  {
    id: 'purple',
    name: 'Purple Avatar',
    bgColor: 'bg-purple-500',
    textColor: 'text-white',
    icon: UserIcon
  },
  {
    id: 'red',
    name: 'Red Avatar',
    bgColor: 'bg-red-500',
    textColor: 'text-white',
    icon: UserIcon
  },
  {
    id: 'yellow',
    name: 'Yellow Avatar',
    bgColor: 'bg-yellow-500',
    textColor: 'text-white',
    icon: UserIcon
  },
  {
    id: 'indigo',
    name: 'Indigo Avatar',
    bgColor: 'bg-indigo-500',
    textColor: 'text-white',
    icon: UserIcon
  },
  {
    id: 'pink',
    name: 'Pink Avatar',
    bgColor: 'bg-pink-500',
    textColor: 'text-white',
    icon: UserIcon
  },
  {
    id: 'teal',
    name: 'Teal Avatar',
    bgColor: 'bg-teal-500',
    textColor: 'text-white',
    icon: UserIcon
  }
]

export default function ProfilePictureSelector({ 
  currentPicture, 
  onSelect, 
  onClose, 
  isOpen 
}: ProfilePictureSelectorProps) {
  const [selectedPicture, setSelectedPicture] = useState(currentPicture || 'default')

  const handleSelect = (pictureId: string) => {
    setSelectedPicture(pictureId)
  }

  const handleConfirm = () => {
    onSelect(selectedPicture)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 transition-opacity"
          aria-hidden="true" 
          onClick={onClose} 
        />
        
        {/* This element is to trick the browser into centering the modal contents. */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        {/* Modal */}
        <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          {/* Header */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Choose Your Profile Picture
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Select an avatar to represent your profile
            </p>
          </div>

          {/* Avatar Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {avatarOptions.map((avatar) => {
              const Icon = avatar.icon
              const isSelected = selectedPicture === avatar.id
              
              return (
                <button
                  key={avatar.id}
                  onClick={() => handleSelect(avatar.id)}
                  className={`relative p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  title={avatar.name}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`w-12 h-12 ${avatar.bgColor} rounded-full flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${avatar.textColor}`} />
                    </div>
                    <span className="text-xs text-gray-600">{avatar.name.split(' ')[0]}</span>
                  </div>
                  
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <CheckIcon className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Preview */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
            <div className="flex items-center space-x-3">
              {(() => {
                const selectedAvatar = avatarOptions.find(a => a.id === selectedPicture)
                if (!selectedAvatar) return null
                const Icon = selectedAvatar.icon
                
                return (
                  <>
                    <div className={`w-10 h-10 ${selectedAvatar.bgColor} rounded-full flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${selectedAvatar.textColor}`} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Your Name</div>
                      <div className="text-xs text-gray-500">Profile Preview</div>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Save Picture
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to get avatar configuration by ID
export const getAvatarConfig = (pictureId?: string | null) => {
  // If pictureId is null, undefined, or empty string, use default
  if (!pictureId || pictureId.trim() === '') {
    return avatarOptions[0] // default avatar
  }
  
  return avatarOptions.find(avatar => avatar.id === pictureId) || avatarOptions[0]
}

// Component to render profile picture consistently across the app
export const ProfilePicture = ({ 
  pictureId, 
  className = "w-8 h-8",
  showInitials = false,
  userName = ""
}: { 
  pictureId?: string | null
  className?: string
  showInitials?: boolean 
  userName?: string
}) => {
  const avatarConfig = getAvatarConfig(pictureId)
  const Icon = avatarConfig.icon
  
  // Determine icon size based on container size
  const getIconSize = () => {
    if (className.includes('w-24') || className.includes('h-24')) {
      return 'w-12 h-12' // Large container
    } else if (className.includes('w-16') || className.includes('h-16')) {
      return 'w-8 h-8' // Medium container
    } else if (className.includes('w-12') || className.includes('h-12')) {
      return 'w-6 h-6' // Medium-small container
    } else if (className.includes('w-10') || className.includes('h-10')) {
      return 'w-5 h-5' // Small-medium container
    } else {
      return 'w-4 h-4' // Default small container
    }
  }
  
  // Determine text size for initials based on container size
  const getTextSize = () => {
    if (className.includes('w-24') || className.includes('h-24')) {
      return 'text-xl'
    } else if (className.includes('w-16') || className.includes('h-16')) {
      return 'text-lg'
    } else if (className.includes('w-12') || className.includes('h-12')) {
      return 'text-base'
    } else {
      return 'text-sm'
    }
  }
  
  return (
    <div className={`${avatarConfig.bgColor} rounded-full flex items-center justify-center ${className}`}>
      {showInitials && userName ? (
        <span className={`${getTextSize()} font-medium ${avatarConfig.textColor}`}>
          {userName.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2)}
        </span>
      ) : (
        <Icon className={`${getIconSize()} ${avatarConfig.textColor}`} />
      )}
    </div>
  )
}
