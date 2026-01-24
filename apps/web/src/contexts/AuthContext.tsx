import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { usePostHog } from '@posthog/react'
import { POSTHOG_EVENTS } from '../lib/posthogEvents'

// Use VITE_APP_URL for OAuth redirects, fallback to window.location.origin
const getRedirectUrl = (path: string) => {
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin
  return `${baseUrl}${path}`
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  console.log('heyyyo', { user })
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const posthog = usePostHog()
  const previousUserRef = useRef<User | null>(null)
  const trackedSignupsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      previousUserRef.current = session?.user ?? null
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const previousUser = previousUserRef.current
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Track login event (user was null/undefined before, now has a user)
        if (event === 'SIGNED_IN' && session?.user && !previousUser) {
          posthog?.identify(session.user.id, {
            email: session.user.email,
          })
          posthog?.capture(POSTHOG_EVENTS.userLoggedIn, {
            method: session.user.app_metadata?.provider || 'email',
          })
        }

        // Track signup event (first time user - only track once per user ID)
        if (event === 'SIGNED_UP' && session?.user && !trackedSignupsRef.current.has(session.user.id)) {
          posthog?.identify(session.user.id, {
            email: session.user.email,
          })
          posthog?.capture(POSTHOG_EVENTS.userSignedUp, {
            method: session.user.app_metadata?.provider || 'email',
          })
          trackedSignupsRef.current.add(session.user.id)
        }

        // Update ref for next comparison
        previousUserRef.current = session?.user ?? null
      }
    )

    return () => subscription.unsubscribe()
  }, [posthog])

  const signInWithGoogle = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getRedirectUrl('/auth/callback')
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in with Google:', error instanceof Error ? error.message : error)
      throw error
    }
  }

  const signUpWithEmail = async (email: string, password: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getRedirectUrl('/auth/callback')
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing up with email:', error instanceof Error ? error.message : error)
      throw error
    }
  }

  const signInWithEmail = async (email: string, password: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in with email:', error instanceof Error ? error.message : error)
      throw error
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error signing out:', error instanceof Error ? error.message : error)
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    signOut,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
