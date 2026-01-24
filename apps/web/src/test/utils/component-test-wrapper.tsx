/**
 * Test wrapper for component integration tests
 * Provides all necessary contexts and mocks
 */

import React, { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

// Mock user data
const mockUser = {
  id: 'user1',
  email: 'test@example.com',
  user_metadata: {},
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  email_confirmed_at: '2023-01-01T00:00:00Z',
  last_sign_in_at: '2023-01-01T00:00:00Z',
  role: 'authenticated',
  identities: [],
  factors: [],
  phone: '',
  phone_confirmed_at: null,
  confirmed_at: '2023-01-01T00:00:00Z',
  recovery_sent_at: null,
  new_email: null,
  invited_at: null,
  action_link: null,
  email_change_sent_at: null,
  new_phone: null,
  phone_change_sent_at: null,
  reauthentication_sent_at: null,
  reauthentication_token: null,
  is_anonymous: false,
}

// Mock session data
const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: 'bearer',
  user: mockUser,
}

// Test query client with shorter timeouts for faster tests
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false, gcTime: 0 },
    mutations: { retry: false },
  },
})

interface ComponentTestWrapperProps {
  children: ReactNode
  queryClient?: QueryClient
  user?: typeof mockUser | null
  session?: typeof mockSession | null
  initialEntries?: string[]
}

export const ComponentTestWrapper: React.FC<ComponentTestWrapperProps> = ({
  children,
  queryClient = createTestQueryClient(),
  user = mockUser,
  session = mockSession,
  initialEntries,
}) => {
  const RouterComponent = initialEntries ? MemoryRouter : BrowserRouter
  const routerProps = initialEntries ? { initialEntries } : {}
  
  return (
    <RouterComponent {...routerProps}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </RouterComponent>
  )
}

// Mock the auth context to return our test user
export const mockAuthContext = {
  user: mockUser,
  session: mockSession,
  loading: false,
  signInWithGoogle: vi.fn(),
  signUpWithEmail: vi.fn(),
  signInWithEmail: vi.fn(),
  signOut: vi.fn(),
  isAuthenticated: true,
}

// Mock the subscription context
export const mockSubscriptionContext = {
  subscriptionStatus: {
    isSubscribed: false,
    sessionsUsed: 2,
    sessionsLimit: 4,
  },
  loading: false,
  canUseCookingAssistant: true,
  sessionsRemaining: 2,
  refreshSubscription: vi.fn(),
  setSessionsUsed: vi.fn(),
}
