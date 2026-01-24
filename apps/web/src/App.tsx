import React, { JSX } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './lib/queryClient'
import { AuthProvider } from './contexts/AuthContext'
import { SubscriptionProvider } from './contexts/SubscriptionContext'
import { ToastProvider } from './contexts/ToastContext'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SearchPage from './pages/SearchPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import HomePage from './pages/HomePage'
import RecipeDetailPage from './pages/RecipeDetailPage'
import TagsPage from './pages/TagsPage'
import VoiceRecipeFlowPage from './pages/VoiceRecipeFlowPage'
import PantryPage from './pages/PantryPage'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

// App component with routing
const AppRoutes = (): JSX.Element => {
  return (
    <Router>
      <Routes>
        {/* Auth pages - no layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        
        {/* Voice recipe flow - standalone, no layout */}
        <Route path="/voice" element={<VoiceRecipeFlowPage />} />
        
        <Route 
          path="/" 
          element={
            <AppLayout>
              <HomePage />
            </AppLayout>
          } 
          />
        
        {/* Legacy route redirects */}
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        
        {/* Protected routes with layout */}
        <Route 
          path="/search" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <SearchPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route
          path="/tags"
          element={
            <ProtectedRoute>
              <AppLayout>
                <TagsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pantry"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PantryPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/:recipeId" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <RecipeDetailPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

// Main App component with providers
const App = (): JSX.Element => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <AppRoutes />
          </SubscriptionProvider>
        </AuthProvider>
      </ToastProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
