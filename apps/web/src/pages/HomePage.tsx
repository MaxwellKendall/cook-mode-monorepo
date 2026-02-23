import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSavedRecipes, useUserTags, useWeeklyPlans } from '../hooks/queries'
import { useGroceryListByPlan } from '../hooks/queries/useGroceryList'
import { useSaveRecipe, useRemoveSavedRecipe } from '../hooks/mutations'
import RecipeGrid from '../components/dashboard/content/RecipeGrid'
import LoadingState from '../components/dashboard/content/LoadingState'
import WelcomeState from '../components/dashboard/content/WelcomeState'
import ActivePlanSummary from '../components/dashboard/ActivePlanSummary'
import PlanCTA from '../components/dashboard/PlanCTA'
import LandingPage from './LandingPage'
import { RecipeBase } from '../types'

const HomePage: React.FC = () => {
  const { user, session } = useAuth()
  const navigate = useNavigate()
  const token = session?.access_token

  // Queries
  const { data: savedRecipes = [], isLoading: savedRecipesLoading } = useSavedRecipes(user?.id)
  const { data: userTags = [], isLoading: userTagsLoading } = useUserTags(user?.id)
  const { data: activePlans = [], isLoading: planLoading } = useWeeklyPlans(user?.id, 'active', token)

  const activePlan = activePlans[0] ?? null
  const { data: groceryList } = useGroceryListByPlan(activePlan?.id, token)

  // Mutations
  const saveRecipe = useSaveRecipe()
  const removeSavedRecipe = useRemoveSavedRecipe()

  // If user is not logged in, show the landing page
  if (!user) {
    return <LandingPage />;
  }

  const handleSaveClick = async (e: React.MouseEvent, isSaved = false, recipe: RecipeBase) => {
    e.stopPropagation()
    if (!user) return

    try {
      if (isSaved) {
        await removeSavedRecipe.mutateAsync({ userId: user.id, recipeId: recipe.id })
      } else {
        await saveRecipe.mutateAsync({ userId: user.id, recipeId: recipe.id })
      }
    } catch (error) {
      console.error('Error toggling save status:', error)
    }
  }

  const isLoading = savedRecipesLoading || planLoading

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {isLoading ? (
        <LoadingState message="Loading your dashboard..." />
      ) : (
        <>
          {/* Plan section — always shown first for authenticated users */}
          {activePlan ? (
            <ActivePlanSummary plan={activePlan} groceryList={groceryList} />
          ) : (
            <PlanCTA />
          )}

          {/* Saved recipes */}
          {savedRecipes.length === 0 ? (
            <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Hero Section */}
              <div className="max-w-4xl mx-auto px-6 py-16 text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                  Start your <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">recipe collection</span>
                </h2>

                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                  Here's what you can do with Cook Mode
                </p>

                <button
                  onClick={() => {
                    const searchInput = document.querySelector('input[placeholder="Search recipes or paste URL..."]') as HTMLInputElement
                    if (searchInput) {
                      searchInput.focus()
                    }
                  }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-lg mb-12"
                >
                  Search recipes
                </button>
              </div>

              {/* Features Section */}
              <div className="py-12 bg-white/50 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto px-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Feature 1: Import Recipes */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Import Recipes
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Import recipes from Pinterest, YouTube, TikTok, or any website on the internet
                      </p>
                      <button
                        onClick={() => {
                          const searchInput = document.querySelector('input[placeholder="Search recipes or paste URL..."]') as HTMLInputElement
                          if (searchInput) {
                            searchInput.focus()
                          }
                        }}
                        className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
                      >
                        Start importing →
                      </button>
                    </div>

                    {/* Feature 2: Voice Assistant */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Voice Assistant
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Use our voice assistant to talk through recipes hands-free while you cook
                      </p>
                      <p className="text-sm text-gray-500">
                        Available when viewing a recipe
                      </p>
                    </div>

                    {/* Feature 3: Save Recipes */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Save Recipes
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Save your favorite recipes to access them quickly anytime
                      </p>
                      <p className="text-sm text-gray-500">
                        Click the bookmark icon on any recipe
                      </p>
                    </div>

                    {/* Feature 4: Tag Recipes */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Organize with Tags
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Tag your recipes to organize them by cuisine, meal type, or any way you like
                      </p>
                      <button
                        onClick={() => navigate('/tags')}
                        className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
                      >
                        Manage tags →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <RecipeGrid
              recipes={savedRecipes}
              title="Your Saved Recipes"
              savedRecipes={savedRecipes}
              onSaveClick={handleSaveClick}
              userTags={userTags}
              userTagsLoading={userTagsLoading}
              userId={user?.id}
            />
          )}
        </>
      )}
    </div>
  )
}

export default HomePage
