import React from 'react'
import { RecipeHeaderProps } from '../../../types'
import TagManager from '../../TagManager'

const RecipeHeader: React.FC<RecipeHeaderProps> = ({
  recipe,
  onBack,
  onSave,
  isSaved,
  isSaveLoading,
  showSaveButton,
  userId,
  userTags,
  userTagsLoading
}) => {
  return (
    <div className="px-6 py-6 border-b border-gray-200">
      {/* Top Row - Back Button and Save Button */}
      <div className="flex items-center mb-4">
        {/* Back Button - Left Arrow */}
        <button
          onClick={onBack}
          className="text-gray-400 mr-auto hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
          aria-label="Back to dashboard"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {/* Right side - TagManager and Save Button */}
        <div className="flex items-center gap-2">
          {/* TagManager icon - positioned to the left of save button */}
          {userId && isSaved && (
            <TagManager
              recipe={recipe}
              loading={userTagsLoading}
              compact={true}
            />
          )}
        </div>
        {/* Save Button - Icon Only for Mobile */}
        {showSaveButton && (
          <button
            onClick={onSave}
            disabled={isSaveLoading}
            className={`
              p-2 rounded-full transition-all duration-200
              ${isSaveLoading 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : isSaved 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }
            `}
            title={isSaved ? 'Remove from saved recipes' : 'Save recipe'}
            aria-label={isSaved ? 'Remove from saved recipes' : 'Save recipe'}
          >
            {isSaveLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : isSaved ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Recipe Content */}
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {recipe.title}
        </h1>
        {/* Display Applied Tags Prominently */}
        {userId && 'userTags' in recipe && Array.isArray(recipe.userTags) && recipe.userTags.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-center flex-wrap gap-2">
              {recipe.userTags.map(tag => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
                  style={{ 
                    backgroundColor: tag.color ? `${tag.color}20` : undefined,
                    borderColor: tag.color || undefined,
                    color: tag.color || undefined
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}
        {recipe.summary && (
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            {recipe.summary}
          </p>
        )}


        {/* Recipe Metadata */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          {recipe.prepTime && (
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Prep: {recipe.prepTime}
            </span>
          )}
          {recipe.cookTime && (
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Cook: {recipe.cookTime}
            </span>
          )}
          {recipe.servings && (
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Serves: {recipe.servings}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default RecipeHeader
