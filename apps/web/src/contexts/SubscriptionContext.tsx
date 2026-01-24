import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { getSubscriptionStatus, setupSubscriptionEvents, SubscriptionStatus, startVoiceSession as startVoiceSessionAPI, endVoiceSession as endVoiceSessionAPI } from '../services/subscriptionService'

interface SubscriptionContextType {
  subscriptionStatus: SubscriptionStatus | null
  loading: boolean
  canUseCookingAssistant: boolean
  minutesRemaining: number  // CHANGED from sessionsRemaining
  refreshSubscription: () => Promise<void>
  startVoiceSession: (recipeId?: string) => Promise<string>  // NEW
  endVoiceSession: (sessionId: string) => Promise<void>  // NEW
  updateMinutesRemaining: (minutesRemaining: number) => void  // NEW
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}

interface SubscriptionProviderProps {
  children: ReactNode
}

export const SubscriptionProvider = ({ children }: SubscriptionProviderProps) => {
  const { user, isAuthenticated } = useAuth()
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  const fetchSubscriptionStatus = async () => {
    if (!user) {
      setSubscriptionStatus(null)
      setLoading(false)
      return
    }

    try {
      const status = await getSubscriptionStatus(user.id)
      setSubscriptionStatus(status)
    } catch (error) {
      console.error('Error fetching subscription status:', error)
      // Set default status for free users
      setSubscriptionStatus({
        isSubscribed: false,
        plan: 'free',
        minutesRemaining: 10,
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshSubscription = async () => {
    await fetchSubscriptionStatus()
  }

  const startVoiceSession = async (recipeId?: string): Promise<string> => {
    if (!user) throw new Error('User not authenticated')
    
    const { sessionId } = await startVoiceSessionAPI(user.id, recipeId)
    setCurrentSessionId(sessionId)
    return sessionId
  }

  const endVoiceSession = async (sessionId: string): Promise<void> => {
    await endVoiceSessionAPI(sessionId)
    setCurrentSessionId(null)
    // Refresh subscription to get updated minutes
    await fetchSubscriptionStatus()
  }

  // NEW: Function to update minutes remaining optimistically
  const updateMinutesRemaining = useCallback((newMinutesRemaining: number) => {
    setSubscriptionStatus(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        minutesRemaining: newMinutesRemaining,
      };
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return
    fetchSubscriptionStatus()
  }, [isAuthenticated])

  // Set up Server-Sent Events for real-time updates
  useEffect(() => {
    if (!user?.id) return

    const eventSource = setupSubscriptionEvents(user.id, () => {
      console.log('debug: subscription refetched')
      fetchSubscriptionStatus()
    })

    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [user?.id])

  // Calculate if user can use cooking assistant
  const canUseCookingAssistant = subscriptionStatus?.isSubscribed || 
    (subscriptionStatus?.minutesRemaining || 0) > 0

  // Calculate remaining minutes
  const minutesRemaining = subscriptionStatus?.minutesRemaining || 0
  
  return (
    <SubscriptionContext.Provider
      value={{
        subscriptionStatus,
        loading,
        canUseCookingAssistant,
        minutesRemaining,
        refreshSubscription,
        startVoiceSession,
        endVoiceSession,
        updateMinutesRemaining,  // NEW
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}
