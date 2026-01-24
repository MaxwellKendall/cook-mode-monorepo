import React from 'react'
import { VoiceFlowTheme } from '../../lib/theme'

interface RecipeSearchPromptProps {
  isSearching: boolean
  theme: VoiceFlowTheme
}

/**
 * Step 2: Visual feedback while listening for recipe request
 */
const RecipeSearchPrompt: React.FC<RecipeSearchPromptProps> = ({
  isSearching,
  theme,
}) => {
  return (
    <div 
      className="flex flex-col items-center justify-center py-12 px-6"
      style={{ backgroundColor: theme.background }}
    >
      {/* Listening indicator */}
      <div className="relative flex items-center justify-center w-24 h-24">
        {/* Animated rings */}
        <span 
          className="absolute inset-0 rounded-full animate-ping opacity-20"
          style={{ backgroundColor: theme.active }}
        />
        <span 
          className="absolute inset-2 rounded-full animate-pulse opacity-40"
          style={{ backgroundColor: theme.active }}
        />
        
        {/* Center circle */}
        <div 
          className="relative flex items-center justify-center w-16 h-16 rounded-full"
          style={{ backgroundColor: theme.micButton.listening }}
        >
          {isSearching ? (
            // Searching spinner
            <svg 
              className="w-8 h-8 animate-spin" 
              style={{ color: theme.textOnPrimary }}
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            // Listening waves
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-1 rounded-full animate-pulse"
                  style={{
                    backgroundColor: theme.textOnPrimary,
                    height: `${12 + Math.sin(i * 0.8) * 8}px`,
                    animationDelay: `${i * 100}ms`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Status text */}
      <h3 
        className="mt-6 text-xl font-medium text-center"
        style={{ color: theme.text }}
      >
        {isSearching ? 'Finding your recipe...' : "I'm listening"}
      </h3>
      
      <p 
        className="mt-2 text-base text-center max-w-sm"
        style={{ color: theme.textMuted }}
      >
        {isSearching 
          ? 'Searching our recipe collection' 
          : 'What would you like to make?'}
      </p>
      
      {/* Suggestions */}
      {!isSearching && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {['Pasta carbonara', 'Chicken stir fry', 'Chocolate cake'].map((suggestion) => (
            <span
              key={suggestion}
              className="px-3 py-1.5 text-sm rounded-full"
              style={{
                backgroundColor: theme.primaryLight,
                color: theme.primaryDark,
              }}
            >
              "{suggestion}"
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default RecipeSearchPrompt
