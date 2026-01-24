import React, { JSX, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../contexts/SubscriptionContext'
import UpgradePrompt from './UpgradePrompt'
import { useRecipeSave } from '../hooks/useRecipeSave'
import { useCookingAssistant } from '../hooks/useCookingAssistant'
import {
  RecipeHeader,
  RecipeImage,
  RecipeIngredients,
  RecipeInstructions,
  RecipeNutrition,
  CookingAssistant
} from './recipe'
import { RecipeDisplayProps } from '../types'
import { useUserTags } from '../hooks/queries'

const RecipeDisplay = ({ recipe, onBack }: RecipeDisplayProps): JSX.Element | null => {
  const { user } = useAuth()
  const { subscriptionStatus, canUseCookingAssistant, minutesRemaining, loading: subscriptionLoading } = useSubscription()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Use the recipe save hook
  const { isSaved, isSaveLoading, handleSaveClick } = useRecipeSave({
    userId: user?.id,
    recipeId: recipe.id
  })

  // Get user tags for TagManager
  const { data: userTags = [], isLoading: userTagsLoading } = useUserTags(user?.id)
  
  // Use the cooking assistant hook
  const {
    isCookModeActive,
    isConnecting,
    error,
    isMuted,
    handleToggleCookMode,
    handleSetMute
  } = useCookingAssistant({
    recipe,
    userId: user?.id,
    canUseCookingAssistant,
    onShowUpgradeModal: () => setShowUpgradeModal(true),
  })

  // Helper function to render session status
  const renderSessionStatus = () => {
    if (subscriptionLoading) {
      return (
        <div className="flex items-center text-sm text-gray-500">
          <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400 mr-2"></div>
          <span>Loading...</span>
        </div>
      )
    }

    if (subscriptionStatus?.isSubscribed) {
      return (
        <div className="flex w-full justify-center items-center space-x-1.5 text-sm text-gray-600">
          {/* Microphone icon */}
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <span>{minutesRemaining} min remaining</span>
        </div>
      )
    }

    if (minutesRemaining === 0) {
      return (
        <div className="flex w-full justify-center items-center">
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {/* Microphone icon */}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <span>Get More Voice Minutes</span>
          </button>
        </div>
      )
    }

    return (
      <div className="flex w-full justify-center items-center space-x-1.5 text-sm text-gray-600">
        {/* Microphone icon */}
        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        <span>{minutesRemaining}/10 free min</span>
      </div>
    )
  }

  if (!recipe) return null

  console.log('render <RecipeDisplay />')
  return (
    <>
      {/* Recipe Header */}
      <RecipeHeader
        recipe={recipe}
        onBack={onBack}
        onSave={handleSaveClick}
        isSaved={isSaved}
        isSaveLoading={isSaveLoading}
        showSaveButton={!!user?.id}
        userId={user?.id}
        userTags={userTags}
        userTagsLoading={userTagsLoading}
      />

      {/* Cooking Assistant */}
      <CookingAssistant
        isCookModeActive={isCookModeActive}
        isConnecting={isConnecting}
        canUseCookingAssistant={canUseCookingAssistant}
        error={error}
        isMuted={isMuted}
        onToggleCookMode={handleToggleCookMode}
        onMuteToggle={() => handleSetMute(!isMuted)}
        onShowUpgradeModal={() => setShowUpgradeModal(true)}
        renderSessionStatus={renderSessionStatus}
      />

      <div className="p-6">
        {/* Recipe Image */}
        <RecipeImage imageUrl={recipe.imageUrl} title={recipe.title} />

        {/* Ingredients Section */}
        <RecipeIngredients ingredients={recipe.ingredients} />

        {/* Instructions Section */}
        <RecipeInstructions instructions={recipe.instructions} />

        {/* Nutrition Information */}
        <RecipeNutrition nutrients={recipe.nutrients} />

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <UpgradePrompt 
            isModal={true}
            onClose={() => setShowUpgradeModal(false)}
          />
        )}
      </div>
    </>
  )
}

export default RecipeDisplay
