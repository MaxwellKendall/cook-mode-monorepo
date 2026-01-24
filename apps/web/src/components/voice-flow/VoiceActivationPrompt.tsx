import React from 'react'
import { VoiceFlowTheme } from '../../lib/theme'

interface VoiceActivationPromptProps {
  onActivate: () => void
  isConnecting: boolean
  theme: VoiceFlowTheme
}

/**
 * Step 1: Big, inviting button to activate voice mode
 * Zero friction - one tap to start
 */
const VoiceActivationPrompt: React.FC<VoiceActivationPromptProps> = ({
  onActivate,
  isConnecting,
  theme,
}) => {
  return (
    <div 
      className="flex flex-col items-center justify-center min-h-[60vh] px-6"
      style={{ backgroundColor: theme.background }}
    >
      {/* Main CTA */}
      <button
        onClick={onActivate}
        disabled={isConnecting}
        className="group relative flex items-center justify-center w-32 h-32 rounded-full transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        style={{
          backgroundColor: isConnecting ? theme.micButton.disabled : theme.micButton.idle,
          boxShadow: `0 8px 32px ${theme.primary}40`,
        }}
        aria-label="Activate voice mode"
      >
        {/* Pulse animation when connecting */}
        {isConnecting && (
          <>
            <span 
              className="absolute inset-0 rounded-full animate-ping opacity-30"
              style={{ backgroundColor: theme.micButton.idle }}
            />
            <span 
              className="absolute inset-0 rounded-full animate-pulse opacity-50"
              style={{ backgroundColor: theme.micButton.idle }}
            />
          </>
        )}
        
        {/* Microphone icon */}
        <svg 
          className="w-14 h-14 transition-transform group-hover:scale-110"
          style={{ color: theme.textOnPrimary }}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
          />
        </svg>
      </button>
      
      {/* Text prompt */}
      <h2 
        className="mt-8 text-2xl font-semibold text-center"
        style={{ color: theme.text }}
      >
        {isConnecting ? 'Connecting...' : 'Tap to start'}
      </h2>
      
      <p 
        className="mt-3 text-lg text-center max-w-sm"
        style={{ color: theme.textMuted }}
      >
        {isConnecting 
          ? 'Setting up your voice assistant' 
          : "Tell me what you'd like to cook"}
      </p>
    </div>
  )
}

export default VoiceActivationPrompt
