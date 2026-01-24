import React, { useRef, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHome, faTags } from '@fortawesome/free-solid-svg-icons'
import { createCustomerPortalSession } from '../../../services/subscriptionService'

interface DashboardHeaderProps {
  user: any
  subscriptionStatus: any
  isDropdownOpen: boolean
  onToggleDropdown: () => void
  onSignOut: () => void
  onShowUpgradeModal: () => void
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  subscriptionStatus,
  isDropdownOpen,
  onToggleDropdown,
  onSignOut,
  onShowUpgradeModal
}) => {
  const navigate = useNavigate()
  const { recipeId } = useParams<{ recipeId?: string }>()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [avatarError, setAvatarError] = useState(false)

  const handleCustomerPortal = async () => {
    try {
      // Pass recipeId if we're on a recipe page, otherwise undefined (will default to dashboard)
      const portalUrl = await createCustomerPortalSession(user?.id, recipeId)
      // Redirect to Stripe customer portal
      window.location.href = portalUrl
    } catch (error) {
      console.error('Error opening customer portal:', error)
      // You might want to show a toast notification here
      alert('Unable to open customer portal. Please try again later.')
    }
  }

  // Reset avatar error when user changes
  useEffect(() => {
    setAvatarError(false)
  }, [user?.user_metadata?.avatar_url])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && isDropdownOpen) {
        onToggleDropdown()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onToggleDropdown, isDropdownOpen])

  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Side - Navigation */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/home')}
            className="p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            title="Go to Dashboard"
          >
            <FontAwesomeIcon 
              icon={faHome} 
              className="w-6 h-6 sm:w-7 sm:h-7" 
            />
          </button>
          <button
            onClick={() => navigate('/tags')}
            className="p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            title="My Collections"
          >
            <FontAwesomeIcon 
              icon={faTags} 
              className="w-6 h-6 sm:w-7 sm:h-7" 
            />
          </button>
        </div>

        {/* Right Side - Minutes + Upgrade Button + Avatar */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Minutes Remaining Display */}
          {subscriptionStatus && (
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              {/* Microphone icon for voice assistant */}
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              {/* Clock icon for time */}
              <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold text-gray-800">
                {subscriptionStatus.isSubscribed 
                  ? `${subscriptionStatus.minutesRemaining} min` 
                  : `${subscriptionStatus.minutesRemaining}/10 min`}
              </span>
            </div>
          )}
          
          {/* Upgrade Button */}
          {!subscriptionStatus?.isSubscribed && (
            <button
              onClick={onShowUpgradeModal}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
              title={`Upgrade for more minutes (${subscriptionStatus && !subscriptionStatus.isSubscribed ? 10 - subscriptionStatus.minutesRemaining : 0}/10 used)`}
            >
              Upgrade
            </button>
          )}

          {/* Avatar Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={onToggleDropdown}
              className="flex items-center space-x-1 sm:space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-1"
            >
              {user?.user_metadata?.avatar_url && !avatarError ? (
                <img
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover"
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata.full_name || user.email}
                  onError={() => {
                    console.log('Error loading avatar, falling back to initials')
                    setAvatarError(true)
                  }}
                />
              ) : (
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gray-900 flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
              <svg
                className={`h-3 w-3 sm:h-4 sm:w-4 text-gray-400 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                <div className="px-3 sm:px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 break-words">
                    {user?.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">{user?.email}</p>
                </div>
                {subscriptionStatus?.isSubscribed && (
                  <button
                    onClick={handleCustomerPortal}
                    className="w-full text-left px-3 sm:px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Manage Subscription
                  </button>
                )}
                <button
                  onClick={onSignOut}
                  className="w-full text-left px-3 sm:px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardHeader
