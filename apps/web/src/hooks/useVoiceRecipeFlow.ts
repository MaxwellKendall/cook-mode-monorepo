import { useState, useRef, useCallback, useEffect } from 'react'
import { createRealtimeConnection, RealtimeConnection } from '../lib/realtimeWebRTC'
import { RecipeFull } from '../types/api'
import { searchRecipes } from '../services/recipeService'

/**
 * Voice Recipe Flow States
 */
export type VoiceFlowState = 
  | 'idle'                    // Initial state - waiting for user to activate voice
  | 'connecting'              // Establishing WebRTC connection
  | 'listening_for_recipe'    // Connected, waiting for user to say a recipe
  | 'searching'               // Processing recipe search
  | 'displaying_recipe'       // Recipe found, showing it
  | 'listening_for_questions' // Ready for Q&A about the recipe
  | 'error'                   // Something went wrong

export interface TranscriptEntry {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: Date
  isPartial?: boolean
}

export interface UseVoiceRecipeFlowOptions {
  userId?: string
  onError?: (error: Error) => void
}

export interface UseVoiceRecipeFlowReturn {
  // State
  flowState: VoiceFlowState
  recipe: RecipeFull | null
  transcript: TranscriptEntry[]
  error: string | null
  isMuted: boolean
  
  // Actions
  activateVoice: () => Promise<void>
  deactivateVoice: () => Promise<void>
  setMuted: (muted: boolean) => void
  reset: () => void
  
  // Helpers
  isConnected: boolean
  isListening: boolean
}

/**
 * Hook for managing the voice-first recipe discovery flow
 * 
 * Flow:
 * 1. User activates voice -> connects to realtime API
 * 2. User speaks a recipe request -> searches for recipe
 * 3. Recipe displayed -> user can ask questions
 * 4. Real-time transcript updates throughout
 */
export const useVoiceRecipeFlow = (
  options: UseVoiceRecipeFlowOptions = {}
): UseVoiceRecipeFlowReturn => {
  const { userId, onError } = options
  
  // State
  const [flowState, setFlowState] = useState<VoiceFlowState>('idle')
  const [recipe, setRecipe] = useState<RecipeFull | null>(null)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  
  // Refs
  const connectionRef = useRef<RealtimeConnection | null>(null)
  const currentTranscriptRef = useRef<string>('')
  
  /**
   * Add a transcript entry
   */
  const addTranscriptEntry = useCallback((
    role: 'user' | 'assistant',
    text: string,
    isPartial = false
  ) => {
    const entry: TranscriptEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role,
      text,
      timestamp: new Date(),
      isPartial,
    }
    
    setTranscript(prev => {
      // If this is a partial update, replace the last entry if it's also partial
      if (isPartial && prev.length > 0 && prev[prev.length - 1].isPartial) {
        return [...prev.slice(0, -1), entry]
      }
      return [...prev, entry]
    })
    
    return entry
  }, [])
  
  /**
   * Handle recipe search from voice input
   */
  const handleRecipeSearch = useCallback(async (query: string) => {
    setFlowState('searching')
    addTranscriptEntry('user', query)
    
    try {
      const result = await searchRecipes(query, userId)
      
      if (result.success && result.data && result.data.length > 0) {
        // Get the first (best match) recipe
        const foundRecipe = result.data[0] as RecipeFull
        setRecipe(foundRecipe)
        setFlowState('displaying_recipe')
        
        addTranscriptEntry(
          'assistant',
          `I found "${foundRecipe.title}". Here's the recipe. Feel free to ask me any questions about it!`
        )
        
        // Transition to Q&A mode after a brief moment
        setTimeout(() => {
          setFlowState('listening_for_questions')
        }, 1000)
      } else {
        addTranscriptEntry(
          'assistant',
          `I couldn't find a recipe for "${query}". Could you try describing a different dish?`
        )
        setFlowState('listening_for_recipe')
      }
    } catch (err) {
      console.error('Recipe search error:', err)
      addTranscriptEntry(
        'assistant',
        'Sorry, I had trouble searching for that recipe. Please try again.'
      )
      setFlowState('listening_for_recipe')
    }
  }, [userId, addTranscriptEntry])
  
  /**
   * Handle incoming events from the realtime connection
   */
  const handleRealtimeEvent = useCallback((event: any) => {
    console.log('[useVoiceRecipeFlow] Event:', event.type, event)
    
    switch (event.type) {
      case 'input_audio_buffer.speech_started':
        // User started speaking
        currentTranscriptRef.current = ''
        break
        
      case 'conversation.item.input_audio_transcription.completed':
        // User finished speaking - we have their transcript
        const userText = event.transcript?.trim()
        if (userText) {
          // If we're waiting for a recipe, trigger search
          if (flowState === 'listening_for_recipe') {
            handleRecipeSearch(userText)
          } else if (flowState === 'listening_for_questions') {
            addTranscriptEntry('user', userText)
          }
        }
        break
        
      case 'response.audio_transcript.delta':
        // Streaming assistant response
        if (event.delta) {
          currentTranscriptRef.current += event.delta
          addTranscriptEntry('assistant', currentTranscriptRef.current, true)
        }
        break
        
      case 'response.audio_transcript.done':
        // Assistant finished responding
        if (currentTranscriptRef.current) {
          // Finalize the transcript entry
          setTranscript(prev => {
            if (prev.length > 0 && prev[prev.length - 1].isPartial) {
              return [
                ...prev.slice(0, -1),
                { ...prev[prev.length - 1], isPartial: false }
              ]
            }
            return prev
          })
          currentTranscriptRef.current = ''
        }
        break
        
      case 'error':
        console.error('[useVoiceRecipeFlow] Realtime error:', event.error)
        setError(event.error?.message || 'An error occurred')
        onError?.(new Error(event.error?.message || 'Realtime error'))
        break
    }
  }, [flowState, handleRecipeSearch, addTranscriptEntry, onError])
  
  /**
   * Activate voice - establish WebRTC connection
   */
  const activateVoice = useCallback(async () => {
    if (connectionRef.current) {
      console.warn('Connection already exists')
      return
    }
    
    setFlowState('connecting')
    setError(null)
    
    try {
      const connection = await createRealtimeConnection({
        // No recipe context initially - we're searching
        recipe: null,
        onConnected: () => {
          console.log('[useVoiceRecipeFlow] Connected')
          setFlowState('listening_for_recipe')
          addTranscriptEntry(
            'assistant',
            "I'm listening. What recipe would you like to make today?"
          )
        },
        onDisconnected: () => {
          console.log('[useVoiceRecipeFlow] Disconnected')
          connectionRef.current = null
          setFlowState('idle')
        },
        onError: (err) => {
          console.error('[useVoiceRecipeFlow] Connection error:', err)
          setError(err.message)
          setFlowState('error')
          onError?.(err)
        },
        onEvent: handleRealtimeEvent,
      })
      
      connectionRef.current = connection
    } catch (err) {
      console.error('[useVoiceRecipeFlow] Failed to connect:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect'
      setError(errorMessage)
      setFlowState('error')
      onError?.(err instanceof Error ? err : new Error(errorMessage))
    }
  }, [handleRealtimeEvent, addTranscriptEntry, onError])
  
  /**
   * Deactivate voice - close connection
   */
  const deactivateVoice = useCallback(async () => {
    if (connectionRef.current) {
      await connectionRef.current.disconnect()
      connectionRef.current = null
    }
    setFlowState('idle')
  }, [])
  
  /**
   * Set mute state
   */
  const setMuted = useCallback((muted: boolean) => {
    if (connectionRef.current) {
      connectionRef.current.mute(muted)
    }
    setIsMuted(muted)
  }, [])
  
  /**
   * Reset the entire flow
   */
  const reset = useCallback(async () => {
    await deactivateVoice()
    setRecipe(null)
    setTranscript([])
    setError(null)
    setIsMuted(false)
    setFlowState('idle')
  }, [deactivateVoice])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (connectionRef.current) {
        connectionRef.current.disconnect()
      }
    }
  }, [])
  
  // Computed values
  const isConnected = flowState !== 'idle' && flowState !== 'connecting' && flowState !== 'error'
  const isListening = flowState === 'listening_for_recipe' || flowState === 'listening_for_questions'
  
  return {
    // State
    flowState,
    recipe,
    transcript,
    error,
    isMuted,
    
    // Actions
    activateVoice,
    deactivateVoice,
    setMuted,
    reset,
    
    // Helpers
    isConnected,
    isListening,
  }
}
