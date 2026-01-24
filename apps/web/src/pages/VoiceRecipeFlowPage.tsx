import React, { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useVoiceRecipeFlow } from '../hooks/useVoiceRecipeFlow'
import { defaultTheme, VoiceFlowTheme, createTheme } from '../lib/theme'
import {
  VoiceActivationPrompt,
  RecipeSearchPrompt,
  RecipeQuestionPrompt,
  TranscriptDisplay,
  CompactRecipeDisplay,
} from '../components/voice-flow'

interface VoiceRecipeFlowPageProps {
  /** Custom theme overrides */
  themeOverrides?: Partial<VoiceFlowTheme>
}

/**
 * Voice Recipe Flow Page
 * 
 * A zero-friction, voice-first recipe discovery experience.
 * 
 * Flow:
 * 1. Tap to activate voice
 * 2. Say what you want to cook
 * 3. See the recipe
 * 4. Ask questions about it
 */
const VoiceRecipeFlowPage: React.FC<VoiceRecipeFlowPageProps> = ({
  themeOverrides,
}) => {
  const { user } = useAuth()
  
  // Apply theme with any overrides
  const theme = useMemo(() => 
    themeOverrides ? createTheme(themeOverrides) : defaultTheme,
    [themeOverrides]
  )
  
  // Voice flow state management
  const {
    flowState,
    recipe,
    transcript,
    error,
    isMuted,
    activateVoice,
    deactivateVoice,
    setMuted,
    reset,
    isListening,
  } = useVoiceRecipeFlow({
    userId: user?.id,
    onError: (err) => console.error('[VoiceRecipeFlowPage] Error:', err),
  })
  
  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: theme.background }}
    >
      {/* Header - minimal, always visible */}
      <header 
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ 
          backgroundColor: theme.surface,
          borderColor: theme.border,
        }}
      >
        <h1 
          className="text-lg font-semibold"
          style={{ color: theme.text }}
        >
          Voice Recipe
        </h1>
        
        <div className="flex items-center space-x-2">
          {/* Mute button - only show when connected */}
          {flowState !== 'idle' && flowState !== 'connecting' && flowState !== 'error' && (
            <button
              onClick={() => setMuted(!isMuted)}
              className="p-2 rounded-lg transition-colors"
              style={{
                backgroundColor: isMuted ? theme.errorLight : theme.surfaceHover,
                color: isMuted ? theme.error : theme.textMuted,
              }}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>
          )}
          
          {/* Reset/Close button - only when active */}
          {flowState !== 'idle' && (
            <button
              onClick={reset}
              className="p-2 rounded-lg transition-colors"
              style={{
                backgroundColor: theme.surfaceHover,
                color: theme.textMuted,
              }}
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </header>
      
      {/* Main content - changes based on flow state */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Error state */}
        {flowState === 'error' && (
          <div 
            className="flex-1 flex flex-col items-center justify-center px-6"
            style={{ backgroundColor: theme.background }}
          >
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: theme.errorLight }}
            >
              <svg 
                className="w-8 h-8" 
                style={{ color: theme.error }}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 
              className="text-xl font-semibold mb-2"
              style={{ color: theme.text }}
            >
              Something went wrong
            </h2>
            <p 
              className="text-center mb-6"
              style={{ color: theme.textMuted }}
            >
              {error || 'Unable to connect to voice service'}
            </p>
            <button
              onClick={reset}
              className="px-6 py-2 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: theme.primary,
                color: theme.textOnPrimary,
              }}
            >
              Try again
            </button>
          </div>
        )}
        
        {/* Step 1: Activation prompt */}
        {flowState === 'idle' && (
          <VoiceActivationPrompt
            onActivate={activateVoice}
            isConnecting={false}
            theme={theme}
          />
        )}
        
        {/* Connecting state */}
        {flowState === 'connecting' && (
          <VoiceActivationPrompt
            onActivate={activateVoice}
            isConnecting={true}
            theme={theme}
          />
        )}
        
        {/* Step 2: Listening for recipe / searching */}
        {(flowState === 'listening_for_recipe' || flowState === 'searching') && (
          <RecipeSearchPrompt
            isSearching={flowState === 'searching'}
            theme={theme}
          />
        )}
        
        {/* Step 3 & 4: Recipe display with Q&A */}
        {(flowState === 'displaying_recipe' || flowState === 'listening_for_questions') && recipe && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Recipe content - scrollable */}
            <div className="flex-1 overflow-y-auto">
              <CompactRecipeDisplay
                recipe={recipe}
                theme={theme}
              />
            </div>
            
            {/* Transcript - collapsible overlay at bottom */}
            {transcript.length > 0 && (
              <div 
                className="border-t"
                style={{ borderColor: theme.border }}
              >
                <TranscriptDisplay
                  entries={transcript}
                  theme={theme}
                  maxHeight="150px"
                />
              </div>
            )}
            
            {/* Q&A prompt bar */}
            <RecipeQuestionPrompt
              recipeName={recipe.title}
              isListening={isListening}
              theme={theme}
            />
          </div>
        )}
        
        {/* Transcript during search phase */}
        {(flowState === 'listening_for_recipe' || flowState === 'searching') && transcript.length > 0 && (
          <div 
            className="border-t mt-auto"
            style={{ borderColor: theme.border }}
          >
            <TranscriptDisplay
              entries={transcript}
              theme={theme}
              maxHeight="150px"
            />
          </div>
        )}
      </main>
      
      {/* Footer status bar - shows connection state */}
      {flowState !== 'idle' && flowState !== 'error' && (
        <footer 
          className="px-4 py-2 border-t flex items-center justify-center"
          style={{ 
            backgroundColor: theme.surface,
            borderColor: theme.border,
          }}
        >
          <div className="flex items-center space-x-2">
            <span 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ 
                backgroundColor: flowState === 'connecting' 
                  ? theme.textMuted 
                  : theme.success 
              }}
            />
            <span 
              className="text-xs"
              style={{ color: theme.textMuted }}
            >
              {flowState === 'connecting' && 'Connecting...'}
              {flowState === 'listening_for_recipe' && 'Listening for recipe'}
              {flowState === 'searching' && 'Searching...'}
              {flowState === 'displaying_recipe' && 'Recipe found'}
              {flowState === 'listening_for_questions' && 'Ask me anything'}
            </span>
          </div>
        </footer>
      )}
    </div>
  )
}

export default VoiceRecipeFlowPage
