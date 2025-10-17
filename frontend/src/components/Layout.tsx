'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  ChartBarIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  BookmarkIcon,
  UserIcon,
  TrophyIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import {
  ChartBarIcon as ChartBarSolid,
  HomeIcon as HomeSolid,
  MagnifyingGlassIcon as MagnifyingSolid,
  BookmarkIcon as BookmarkSolid,
  UserIcon as UserSolid,
  TrophyIcon as TrophySolid,
  CogIcon as CogSolid
} from '@heroicons/react/24/solid'
import { ProfilePicture } from '@/components/profile/ProfilePictureSelector'

interface LayoutProps {
  children: React.ReactNode
}

const getNavigation = (isAdmin: boolean) => {
  const baseNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, iconSolid: HomeSolid },
    { name: 'Search Stocks', href: '/search', icon: MagnifyingGlassIcon, iconSolid: MagnifyingSolid },
    { name: 'Predictions', href: '/predictions', icon: ChartBarIcon, iconSolid: ChartBarSolid },
    { name: 'Watchlist', href: '/watchlist', icon: BookmarkIcon, iconSolid: BookmarkSolid },
    { name: 'Goals', href: '/goals', icon: TrophyIcon, iconSolid: TrophySolid },
    { name: 'Profile', href: '/profile', icon: UserIcon, iconSolid: UserSolid },
  ]
  
  if (isAdmin) {
    baseNavigation.push({
      name: 'Admin Dashboard', 
      href: '/admin/dashboard', 
      icon: CogIcon, 
      iconSolid: CogSolid
    })
  }
  
  return baseNavigation
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const navigation = getNavigation(user?.role === 'admin')

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed top-0 left-0 bottom-0 w-64 bg-white shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Stolckr</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <nav className="mt-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = isActive ? item.iconSolid : item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 border-r-4 border-blue-500 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
            <div className="flex items-center flex-shrink-0 px-4 py-6 border-b border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <ChartBarSolid className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-3">
                  <h2 className="text-lg font-semibold text-gray-900">Stolckr</h2>
                </div>
              </div>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-2 py-4 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = isActive ? item.iconSolid : item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-gray-500 hover:text-gray-600"
                >
                  <Bars3Icon className="w-6 h-6" />
                </button>
                <div className="ml-4 lg:ml-0">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
                  </h1>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <ProfilePicture 
                    pictureId={user?.profile_picture} 
                    className="w-8 h-8" 
                    userName={user?.full_name || user?.email}
                    showInitials={false}
                  />
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {user?.full_name || user?.email || 'User'}
                  </span>
                  <button
                    onClick={logout}
                    className="text-gray-400 hover:text-gray-500"
                    title="Logout"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="py-4 sm:py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 page-container">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
