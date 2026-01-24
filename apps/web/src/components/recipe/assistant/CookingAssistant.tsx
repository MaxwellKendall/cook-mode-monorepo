import React from 'react'
import VolumeDisplay from '../../VolumeDisplay'

interface CookingAssistantProps {
  isCookModeActive: boolean
  isConnecting: { loading: boolean; isConnected: boolean }
  canUseCookingAssistant: boolean
  error: string | null
  isMuted: boolean
  onToggleCookMode: () => void
  onMuteToggle: () => void
  onShowUpgradeModal: () => void
  renderSessionStatus: () => React.ReactNode
}

const CookingAssistant: React.FC<CookingAssistantProps> = ({
  isCookModeActive,
  isConnecting,
  canUseCookingAssistant,
  error,
  isMuted,
  onToggleCookMode,
  onMuteToggle,
  onShowUpgradeModal,
  renderSessionStatus
}) => {
  return (
    <div className={`px-6 py-6 border-b ${
      isCookModeActive 
        ? 'bg-green-50 border-green-200' 
        : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className={`text-lg font-medium ${
            isCookModeActive ? 'text-green-800' : 'text-gray-900'
          }`}>
            Voice cooking assistant
          </h3>            
          {/* Session Status */}
          <div className="flex items-center mt-1">
            {renderSessionStatus()}
          </div>
        </div>
        {canUseCookingAssistant && (
          <button
            onClick={onToggleCookMode}
            disabled={isConnecting.loading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200 ${
              isCookModeActive ? 'bg-green-600' : isConnecting.loading ? 'bg-gray-400' : 'bg-gray-200'
            }`}
            aria-label="Toggle cook mode"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isCookModeActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        )}
      </div>
      
      {/* Volume Level Indicator - Dropdown when connected */}
      <VolumeDisplay
        error={error}
        isMuted={isMuted}
        isConnected={isConnecting.isConnected}
        isLoading={isConnecting.loading}
        onMuteToggle={onMuteToggle}
      />
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}

export default CookingAssistant
