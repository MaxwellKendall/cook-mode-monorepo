import React, { useEffect } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useRecipe } from '../hooks/queries'
import { useToast } from '../contexts/ToastContext'
import RecipeDisplay from '../components/RecipeDisplay'
import LoadingState from '../components/dashboard/content/LoadingState'
import ErrorState from '../components/dashboard/content/ErrorState'

const RecipeDetailPage: React.FC = () => {
  const { recipeId } = useParams<{ recipeId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { showToast } = useToast()

  // React Query hook - userId is optional for anonymous users
  const { data: recipe, isLoading, error } = useRecipe(recipeId, user?.id)

  // Handle upgrade celebration
  useEffect(() => {
    const celebrate = searchParams.get('celebrate')
    if (celebrate === 'true') {
      showToast(
        '🎉 Welcome to Pro! You now have unlimited cooking sessions!',
        'success',
        8000
      )
      searchParams.delete('celebrate')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams, showToast])

  // Redirect if no recipeId
  useEffect(() => {
    if (!recipeId) {
      navigate('/')
    }
  }, [recipeId, navigate])

  const handleBackToHome = () => {
    navigate('/')
  }

  if (!recipeId) {
    return null
  }

  if (isLoading) {
    return <LoadingState message="Loading recipe..." />
  }

  if (error) {
    return <ErrorState error={error.message} onBack={handleBackToHome} />
  }

  if (!recipe) {
    return <ErrorState error="Recipe not found" onBack={handleBackToHome} />
  }

  const isShareRef = searchParams.get('ref') === 'share';

  return (
    <div className="max-w-4xl mx-auto">
      {isShareRef && (
        <div className="mb-4 bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-orange-800">
            Want your own AI dinner idea?
          </p>
          <Link
            to="/meal"
            className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Get Tonight's Dinner →
          </Link>
        </div>
      )}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <RecipeDisplay
          recipe={recipe}
          onBack={handleBackToHome}
        />
      </div>
    </div>
  )
}

export default RecipeDetailPage
