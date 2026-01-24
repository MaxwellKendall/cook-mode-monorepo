import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSavedRecipes, useUserTags } from '../hooks/queries'
import { useSaveRecipe, useRemoveSavedRecipe } from '../hooks/mutations'
import { searchRecipes } from '../services/recipeService'
import RecipeGrid from '../components/dashboard/content/RecipeGrid'
import LoadingState from '../components/dashboard/content/LoadingState'
import { RecipeBase } from '../types'

const SearchPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Queries
  const { data: savedRecipes = [] } = useSavedRecipes(user?.id)
  const { data: userTags = [], isLoading: userTagsLoading } = useUserTags(user?.id)
  
  // Mutations
  const saveRecipe = useSaveRecipe()
  const removeSavedRecipe = useRemoveSavedRecipe()
  
  const [searchResults, setSearchResults] = useState<RecipeBase[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const query = searchParams.get('q') || ''

  // Perform search when query changes
  useEffect(() => {
    if (query && user?.id) {
      const performSearch = async () => {
        try {
          setSearchLoading(true)
          setError(null)
          const searchResponse = await searchRecipes(query, user.id)
          
          if (searchResponse.success && searchResponse.data) {
            // No transformation needed - API returns RecipeBase[]
            setSearchResults(searchResponse.data)
          } else {
            setError(searchResponse.error || 'Failed to search recipes')
            setSearchResults([])
          }
        } catch (error) {
          console.error('Error performing search:', error)
          setError('An error occurred while searching')
          setSearchResults([])
        } finally {
          setSearchLoading(false)
        }
      }
      
      performSearch()
    } else if (!query) {
      // If no query, redirect to home
      navigate('/')
    }
  }, [query, user?.id, navigate])

  const handleClearResults = () => {
    navigate('/')
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


  if (!user) {
    navigate('/')
    return null
  }


  if (searchLoading) {
    return <LoadingState message="Searching recipes..." />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Search Error</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <RecipeGrid
          recipes={searchResults}
          title={`Search Results for "${query}"`}
          showClearButton={true}
          onClearResults={handleClearResults}
          savedRecipes={savedRecipes}
          onSaveClick={handleSaveClick}
          userTags={userTags}
          userTagsLoading={userTagsLoading}
          userId={user?.id}
        />
      </div>
    </div>
  )
}

export default SearchPage
