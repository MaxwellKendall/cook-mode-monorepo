import { useState, useRef, useEffect, useCallback } from 'react'
import { createRealtimeConnection, RealtimeConnection } from '../lib/realtimeWebRTC'
import { useSubscription } from '../contexts/SubscriptionContext'
import { recordTokenUsage } from '../services/subscriptionService'

interface UseCookingAssistantProps {
  recipe: any
  userId?: string
  canUseCookingAssistant: boolean
  onShowUpgradeModal: () => void
}

/**
 * Pure function to build connection config from props
 */
const buildConnectionConfig = (
  recipe: any,
  callbacks: {
    onConnected: () => void;
    onDisconnected: () => void;
    onError: (error: Error) => void;
    onEvent: (event: any) => void;
    onResponseDone?: (usage: {
      input_token_details?: { audio_tokens?: number };
      output_token_details?: { audio_tokens?: number };
    }) => Promise<void>;
  }
) => ({
  recipe,
  ...callbacks,
});

/**
 * Pure function to handle connection error
 */
const handleConnectionError = (
  error: unknown,
  setError: (error: string | null) => void,
  setIsCookModeActive: (active: boolean) => void,
  setIsConnecting: (state: { loading: boolean; isConnected: boolean }) => void
): void => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  setError(errorMessage);
  setIsCookModeActive(false);
  setIsConnecting({ loading: false, isConnected: false });
};

export const useCookingAssistant = ({
  recipe,
  userId,
  canUseCookingAssistant,
  onShowUpgradeModal,
}: UseCookingAssistantProps) => {
  const [isCookModeActive, setIsCookModeActive] = useState(false)
  const [isConnecting, setIsConnecting] = useState({ loading: false, isConnected: false })
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const connectionRef = useRef<RealtimeConnection | null>(null)
  const { startVoiceSession, endVoiceSession, updateMinutesRemaining } = useSubscription()
  const sessionIdRef = useRef<string | null>(null)

  // Disconnect from Realtime session
  const disconnectFromRealtime = useCallback(async () => {
    try {
      if (connectionRef.current) {
        await connectionRef.current.disconnect();
        connectionRef.current = null;
      }
      
      // End voice session tracking
      if (sessionIdRef.current) {
        await endVoiceSession(sessionIdRef.current)
        sessionIdRef.current = null
      }
      
      setIsCookModeActive(false);
      setIsConnecting({ loading: false, isConnected: false });
      setError(null);
    } catch (err) {
      console.error('Error disconnecting from Realtime session:', err);
    }
  }, [endVoiceSession]);

  // Initialize and connect to Realtime session
  const connectToRealtime = useCallback(async () => {
    try {
      // Start voice session tracking
      if (userId) {
        const sessionId = await startVoiceSession(recipe?.id)
        sessionIdRef.current = sessionId
      }

      const config = buildConnectionConfig(
        recipe,
        {
          onConnected: () => {
            setIsConnecting({ loading: false, isConnected: true });
          },
          onDisconnected: async () => {
            // End voice session tracking
            if (sessionIdRef.current) {
              await endVoiceSession(sessionIdRef.current)
              sessionIdRef.current = null
            }
            setIsCookModeActive(false);
            setIsConnecting({ loading: false, isConnected: false });
          },
          onError: (err) => {
            handleConnectionError(err, setError, setIsCookModeActive, setIsConnecting);
          },
          onEvent: async (event) => {
            // Log all events for debugging to understand why onEvent might not fire
            console.log('[useCookingAssistant] onEvent received:', event.type, event);
          },
          onResponseDone: async (usage) => {
            // Track token usage from response.done events
            // Usage structure from OpenAI Realtime API:
            // {
            //   input_token_details: { audio_tokens: number },
            //   output_token_details: { audio_tokens: number }
            // }
            const inputTokens = usage.input_token_details?.audio_tokens || 0;
            const outputTokens = usage.output_token_details?.audio_tokens || 0;
            
            console.log('[useCookingAssistant] onResponseDone called with usage:', { 
              inputTokens, 
              outputTokens, 
              userId,
              fullUsage: usage 
            });
            
            if ((inputTokens > 0 || outputTokens > 0) && userId) {
              try {
                const result = await recordTokenUsage(userId, inputTokens, outputTokens);
                
                // Update client-side state with new minutesRemaining
                updateMinutesRemaining(result.minutesRemaining);
                
                // Check if budget exceeded - disconnect immediately
                if (!result.hasAvailable) {
                  console.warn('Token budget exceeded, disconnecting session');
                  await disconnectFromRealtime();
                  onShowUpgradeModal();
                }
              } catch (error) {
                console.error('Error recording token usage:', error);
                // Fail closed - disconnect immediately on error
                await disconnectFromRealtime();
                onShowUpgradeModal();
              }
            }
          },
        }
      );

      const connection = await createRealtimeConnection(config);
      connectionRef.current = connection;
    } catch (err) {
      console.error('Failed to connect to Realtime session:', err);
      handleConnectionError(err, setError, setIsCookModeActive, setIsConnecting);
      throw err;
    }
  }, [recipe, userId, startVoiceSession, updateMinutesRemaining, onShowUpgradeModal, disconnectFromRealtime]);

  const handleToggleCookMode = async () => {
    if (isCookModeActive) {
      await disconnectFromRealtime()
    } else {
      // Check if user can use cooking assistant
      if (!canUseCookingAssistant) {
        // Show upgrade CTA when minutes are exhausted
        onShowUpgradeModal()
        return
      }

      // Optimistic UI: immediately show as active
      setIsCookModeActive(true)
      setIsConnecting({ loading: true, isConnected: false })
      setError(null)

      // Then attempt connection in background
      try {
        await connectToRealtime()
      } catch (err) {
        // If connection fails, revert optimistic state
        setIsCookModeActive(false)
        setIsConnecting({ loading: false, isConnected: false })
        console.error('Failed to connect to Realtime session:', err)
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(`Failed to connect: ${errorMessage}`)
      }
    }
  }

  const handleSetMute = useCallback((payload: boolean) => {
    if (connectionRef.current) {
      connectionRef.current.mute(payload);
    }
    setIsMuted(payload);
  }, []);

  return {
    isCookModeActive,
    isConnecting,
    error,
    isMuted,
    handleToggleCookMode,
    handleSetMute
  }
}
