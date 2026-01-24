import React from 'react'
import { VoiceFlowTheme } from '../../lib/theme'

interface RecipeQuestionPromptProps {
  recipeName: string
  isListening: boolean
  theme: VoiceFlowTheme
}

/**
 * Step 4: Prompt for asking questions about the recipe
 */
const RecipeQuestionPrompt: React.FC<RecipeQuestionPromptProps> = ({
  recipeName,
  isListening,
  theme,
}) => {
  return (
    <div 
      className="flex items-center justify-between px-4 py-3 border-t"
      style={{ 
        backgroundColor: theme.activeLight,
        borderColor: theme.border,
      }}
    >
      {/* Listening indicator */}
      <div className="flex items-center space-x-3">
        <div 
          className="relative flex items-center justify-center w-10 h-10 rounded-full"
          style={{ backgroundColor: theme.micButton.listening }}
        >
          {isListening ? (
            // Animated listening indicator
            <div className="flex items-center space-x-0.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-0.5 rounded-full animate-pulse"
                  style={{
                    backgroundColor: theme.textOnPrimary,
                    height: `${8 + Math.sin(i * 0.8) * 4}px`,
                    animationDelay: `${i * 150}ms`,
                  }}
                />
              ))}
            </div>
          ) : (
            <svg 
              className="w-5 h-5" 
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
          )}
        </div>
        
        <div>
          <p 
            className="text-sm font-medium"
            style={{ color: theme.text }}
          >
            {isListening ? 'Listening...' : 'Voice assistant active'}
          </p>
          <p 
            className="text-xs"
            style={{ color: theme.textMuted }}
          >
            Ask me anything about {recipeName}
          </p>
        </div>
      </div>
      
      {/* Quick question hints */}
      <div className="hidden sm:flex items-center space-x-2">
        {['How long?', 'Substitutions?'].map((hint) => (
          <span
            key={hint}
            className="px-2 py-1 text-xs rounded-full"
            style={{
              backgroundColor: theme.surface,
              color: theme.textMuted,
              border: `1px solid ${theme.border}`,
            }}
          >
            {hint}
          </span>
        ))}
      </div>
    </div>
  )
}

export default RecipeQuestionPrompt
