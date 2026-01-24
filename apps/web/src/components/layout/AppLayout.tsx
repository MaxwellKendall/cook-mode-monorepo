import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useSubscription } from '../../contexts/SubscriptionContext'
import DashboardHeader from '../dashboard/header/DashboardHeader'
import HeaderSearchBar from '../dashboard/header/HeaderSearchBar'
import FeedbackWidget from '../dashboard/feedback/FeedbackWidget'
import UpgradePrompt from '../UpgradePrompt'

interface AppLayoutProps {
  children: React.ReactNode
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth()
  const { subscriptionStatus } = useSubscription()
  const navigate = useNavigate()
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false)

  const handleSearchResults = (recipes: any[]) => {
    // Navigate to home page with search results
    navigate('/home', { 
      state: { 
        searchResults: recipes,
        searchQuery: 'search'
      }
    })
  }

  if (!user) {
    // If no user, just render children (for landing page)
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Global Header */}
      <DashboardHeader
        user={user}
        subscriptionStatus={subscriptionStatus}
        isDropdownOpen={isDropdownOpen}
        onToggleDropdown={() => setIsDropdownOpen(!isDropdownOpen)}
        onSignOut={signOut}
        onShowUpgradeModal={() => setShowUpgradeModal(true)}
      />

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        {/* Global Search Bar */}
        <div className="mb-6">
          <div className="flex justify-center">
            <div className="w-full max-w-lg">
              <HeaderSearchBar 
                userId={user?.id}
                onSearchResults={handleSearchResults}
              />
            </div>
          </div>
        </div>
        
        {children}
      </main>

      {/* Global Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-6 mb-4 md:mb-0">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <span className="text-lg font-semibold text-gray-900">Cook Mode</span>
              </div>
              <p className="text-sm text-gray-500">
                Your AI-powered cooking assistant
              </p>
            </div>
            
            <div className="flex items-center space-x-6">
              <a 
                href="https://cook-mode.canny.io/cook-mode" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Feedback
              </a>
              <a 
                href="/privacy" 
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Privacy
              </a>
              <a 
                href="/terms" 
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Terms
              </a>
              <div className="text-sm text-gray-400">
                © {new Date().getFullYear()} Cook Mode
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Global Feedback Widget */}
      <FeedbackWidget
        isOpen={isFeedbackOpen}
        onToggle={() => setIsFeedbackOpen(!isFeedbackOpen)}
      />

      {/* Global Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradePrompt 
          isModal={true}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  )
}

export default AppLayout
