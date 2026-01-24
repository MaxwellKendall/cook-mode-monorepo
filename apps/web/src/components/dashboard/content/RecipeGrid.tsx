import React from 'react'
import { useNavigate } from 'react-router-dom'
import RecipeCard from '../../RecipeCard'
import { RecipeGridProps } from '../../../types'

const RecipeGrid: React.FC<RecipeGridProps> = ({
  recipes,
  title,
  showClearButton = false,
  onClearResults,
  savedRecipes,
  onSaveClick,
  userTags,
  userTagsLoading = false,
  userId
}) => {
  const navigate = useNavigate()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {title} ({recipes.length})
        </h2>
        {showClearButton && onClearResults && (
          <button
            onClick={onClearResults}
            className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            Clear Results
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {recipes.map((recipe, index) => (
          <RecipeCard
            key={recipe.id || index}
            recipe={recipe}
            onClick={() => navigate(`/${recipe.id}`)}
            userId={userId}
            isSaved={savedRecipes.some(r => r.id === recipe.id)}
            handleSaveClick={onSaveClick}
            userTags={userTags}
            userTagsLoading={userTagsLoading}
          />
        ))}
      </div>
    </div>
  )
}

export default RecipeGrid
