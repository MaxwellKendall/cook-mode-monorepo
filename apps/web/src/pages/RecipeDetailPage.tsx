import React, { useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
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
  
  // React Query hook replaces all state management
  const { data: recipe, isLoading, error } = useRecipe(recipeId, user?.id)

  // Handle upgrade celebration
  useEffect(() => {
    const celebrate = searchParams.get('celebrate')
    if (celebrate === 'true') {
      showToast(
        '🎉 Welcome to Pro! You now have unlimited cooking sessions!',
        'success',
        8000 // Show for 8 seconds to celebrate
      )
      // Remove the query parameter from URL
      searchParams.delete('celebrate')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams, showToast])

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/')
    }
  }, [user, navigate])

  // Redirect if no recipeId
  useEffect(() => {
    if (!recipeId) {
      navigate('/')
    }
  }, [recipeId, navigate])

  const handleBackToHome = () => {
    navigate('/')
  }

  // Early return for missing user
  if (!user || !recipeId) {
    return null
  }

  // Loading state
  if (isLoading) {
    return <LoadingState message="Loading recipe..." />
  }

  // Error state
  if (error) {
    return <ErrorState error={error.message} onBack={handleBackToHome} />
  }

  // Not found state
  if (!recipe) {
    return <ErrorState error="Recipe not found" onBack={handleBackToHome} />
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      <RecipeDisplay
        recipe={recipe}
        onBack={handleBackToHome}
      />
    </div>
  )
}

export default RecipeDetailPage
