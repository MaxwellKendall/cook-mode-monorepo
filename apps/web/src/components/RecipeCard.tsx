import React, { useState, useEffect } from 'react'
import { saveRecipeForUser, removeSavedRecipe, isRecipeSavedForUser } from '../services/recipeService'
import { RecipeBase } from '../types'
import { useSavedRecipes } from '../hooks/queries'


interface RecipeCardProps {
  recipe: RecipeBase
  onClick?: () => void
  className?: string
  userId?: string
  isSaved?: boolean
  handleSaveClick: (e: React.MouseEvent, isSaved: boolean, recipe: RecipeBase) => void
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onClick,
  className = "",
  userId,
  isSaved,
  handleSaveClick
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { data: savedRecipes = [] } = useSavedRecipes(userId)
  
  // Get the fresh recipe from React Query if it's saved (to avoid stale tags)
  const freshRecipe = isSaved 
    ? savedRecipes.find(r => r.id === recipe.id) || recipe
    : recipe

  const handleClick = () => {
    if (onClick) {
      onClick()
    }
  }

  const getPreviewText = () => {
    return recipe.summary || "No description available"
  }

  const truncateText = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  const formatTime = (time: string | undefined) => {
    if (!time) return null
    if (time === '--') return null
    return time
  }


  return (
    <div
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 
        overflow-hidden transition-all duration-200 
        hover:shadow-md hover:border-gray-300 
        cursor-pointer group
        ${className}
      `}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Recipe Image */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextElementSibling?.classList.remove('hidden')
            }}
          />
        ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        )}
        {/* Rating Badge */}
        {recipe.rating && recipe.rating > 0 && (
          <div className="absolute top-3 right-3 bg-white bg-opacity-90 rounded-full px-2 py-1 flex items-center space-x-1">
            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">
              {recipe.rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Save Button */}
        {userId && (
          <button
            onClick={(e) => handleSaveClick(e, !!isSaved, recipe)}
            disabled={isLoading}
            className={`
              absolute top-3 left-3 bg-white bg-opacity-90 rounded-full p-2 
              transition-all duration-200 hover:bg-opacity-100
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}
            `}
          >
            {isLoading ? (
              <svg className="w-4 h-4 text-gray-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : isSaved ? (
              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </button>
        )}

      </div>

      {/* Recipe Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
          {recipe.title}
        </h3>

        {/* Preview Text */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-3">
          {truncateText(getPreviewText())}
        </p>

        {/* Recipe Meta */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            {formatTime(recipe.prepTime) && (
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Prep: {formatTime(recipe.prepTime)}</span>
              </div>
            )}
            {formatTime(recipe.cookTime) && (
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Cook: {formatTime(recipe.cookTime)}</span>
              </div>
            )}
          </div>
          
          {recipe.servings && (
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>{recipe.servings}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RecipeCard
