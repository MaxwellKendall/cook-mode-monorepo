import { loadStripe } from '@stripe/stripe-js'
import { ADVERTISED_MINUTES, PLAN_PRICES, PLAN_NAMES, MONTHLY_PLAN_LIMIT, type Plan } from '../config/plans'

// Initialize Stripe with fallback
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const MONTHLY_PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_ID_MONTHLY || 'price_monthly_placeholder'
const YEARLY_PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_ID_YEARLY || 'price_yearly_placeholder'

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  minutes?: number
  interval: 'month' | 'year'
  features: string[]
  stripePriceId: string
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'pro',
    name: PLAN_NAMES.pro,
    price: PLAN_PRICES.pro,
    minutes: ADVERTISED_MINUTES.pro,
    interval: 'month',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_PRO,
    features: [
      'Unlimited weekly meal plans',
      `${ADVERTISED_MINUTES.pro} min/mo voice cooking`,
      'Plan history',
      'Household sharing',
      'Unlimited meal swaps',
    ],
  },
]

export { MONTHLY_PLAN_LIMIT }

// Simple subscription service for session tracking and upgrade flow
export interface SubscriptionStatus {
  isSubscribed: boolean
  plan: string
  minutesRemaining: number
}

// Get subscription status from backend
export const getSubscriptionStatus = async (userId: string): Promise<SubscriptionStatus> => {
  try {
    const response = await fetch(`${API_BASE_URL}/subscription/status/${userId}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.success) {
      return data.data
    } else {
      throw new Error(data.error || 'Failed to fetch subscription status')
    }
  } catch (error) {
    console.error('Error fetching subscription status:', error)
    // Return default status for free users
    return {
      isSubscribed: false,
      plan: 'free',
      minutesRemaining: 10,
    }
  }
}

// Create Stripe checkout session
export const createCheckoutSession = async (priceId: string, userId: string, email?: string, recipeId?: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        userId,
        email,
        recipeId
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const { data, success, error } = await response.json()
    
    if (success) {
      // Redirect to Stripe checkout
      window.location.href = data.url
      return {
        success: true,
        sessionId: data.sessionId,
        redirectUrl: data.url
      }
    } else {
      throw new Error(error || 'Failed to create checkout session')
    }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

// Set up Server-Sent Events for real-time subscription updates
export const setupSubscriptionEvents = (userId: string, onUpdate: () => void) => {
  // @TODO: https://linear.app/custom-voice-app/issue/CUS-39/server-side-performancesse-unused-without-embedded-stripe-ui
  // const eventSource = new EventSource(`${API_BASE_URL}/subscription/events/${userId}`)
  const eventSource = { close: () => {}, onmessage: (event: { data: string }) => {}, onerror: (error: { data: string}) => {}}
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      console.log('debug: SSE event:', data)
      
      if (data.type === 'subscription_update' || data.type === 'subscription_canceled') {
        // Trigger subscription refresh
        onUpdate()
      }
    } catch (error) {
      console.error('debug: Error parsing SSE event:', error)
    }
  }
  
  eventSource.onerror = (error) => {
    console.error('debug:SSE connection error:', error)
    // Reconnect after a delay
    setTimeout(() => {
      console.log('debug: SSE connection error, reconnecting...')
      setupSubscriptionEvents(userId, onUpdate)
    }, 10000)
  }
  
  return eventSource
}

// Start a voice session
export const startVoiceSession = async (userId: string, recipeId?: string): Promise<{ sessionId: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/voice-session/start/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipe_id: recipeId }),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.success) {
      return data.data
    } else {
      throw new Error(data.error || 'Failed to start voice session')
    }
  } catch (error) {
    console.error('Error starting voice session:', error)
    throw error
  }
}

// End a voice session
export const endVoiceSession = async (sessionId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/voice-session/end/${sessionId}`, {
      method: 'POST',
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to end voice session')
    }
  } catch (error) {
    console.error('Error ending voice session:', error)
    throw error
  }
}

/**
 * Record token usage after each response.done event
 * Server updates database and returns updated minutesRemaining
 */
export const recordTokenUsage = async (
  userId: string,
  inputTokens: number,
  outputTokens: number
): Promise<{
  hasAvailable: boolean;
  minutesRemaining: number;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/voice-session/usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      hasAvailable: data.hasAvailable,
      minutesRemaining: data.minutesRemaining,
    };
  } catch (error) {
    console.error('Error recording token usage:', error);
    // Fail closed - assume no budget available
    return { 
      hasAvailable: false,
      minutesRemaining: 0,
    };
  }
};

// Create customer portal session for subscription management
export const createCustomerPortalSession = async (
  userId: string,
  recipeId?: string
): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/customer-portal/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipeId }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.success && data.data?.url) {
      return data.data.url
    } else {
      throw new Error(data.error || 'Failed to create customer portal session')
    }
  } catch (error) {
    console.error('Error creating customer portal session:', error)
    throw error
  }
}
