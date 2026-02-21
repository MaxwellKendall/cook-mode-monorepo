import React, { useEffect, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useRecipe, useWeeklyPlans } from '../hooks/queries'
import { useMarkMealCooked } from '../hooks/mutations'
import { useToast } from '../contexts/ToastContext'
import RecipeDisplay from '../components/RecipeDisplay'
import LoadingState from '../components/dashboard/content/LoadingState'
import ErrorState from '../components/dashboard/content/ErrorState'

const RecipeDetailPage: React.FC = () => {
  const { recipeId } = useParams<{ recipeId: string }>()
  const { user, session } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { showToast } = useToast()
  const token = session?.access_token

  // React Query hook - userId is optional for anonymous users
  const { data: recipe, isLoading, error } = useRecipe(recipeId, user?.id)

  // Plan context — prefer URL params, fall back to querying active plans
  const planIdParam = searchParams.get('planId')
  const dayParam = searchParams.get('day')
  const dayNumber = dayParam ? parseInt(dayParam, 10) : null

  // Only query active plans if we don't have params and user is logged in
  const { data: activePlans } = useWeeklyPlans(
    !planIdParam && user ? user.id : undefined,
    'active',
    token
  )

  // Find whether this recipe is part of an active plan
  const planContext = useMemo(() => {
    if (planIdParam && dayNumber !== null) {
      return { planId: planIdParam, day: dayNumber }
    }
    if (!activePlans || !recipeId) return null
    for (const plan of activePlans) {
      const meal = plan.meals?.find((m) => m.recipeId === recipeId)
      if (meal) return { planId: plan.id, day: meal.day }
    }
    return null
  }, [planIdParam, dayNumber, activePlans, recipeId])

  // Mark as cooked mutation
  const markCooked = useMarkMealCooked(token)

  // Determine if already cooked from the active plans cache
  const alreadyCooked = useMemo(() => {
    if (!planContext || !activePlans) return false
    const plan = activePlans.find((p) => p.id === planContext.planId)
    const meal = plan?.meals?.find((m) => m.day === planContext.day)
    return !!meal?.cookedAt
  }, [planContext, activePlans])

  // Weekly progress
  const weekProgress = useMemo(() => {
    if (!planContext || !activePlans) return null
    const plan = activePlans.find((p) => p.id === planContext.planId)
    if (!plan?.meals) return null
    const total = plan.meals.length
    const cooked = plan.meals.filter((m) => m.cookedAt).length
    return { cooked, total }
  }, [planContext, activePlans])

  const handleMarkCooked = () => {
    if (!planContext) return
    markCooked.mutate(
      { planId: planContext.planId, day: planContext.day },
      {
        onSuccess: () => showToast('Meal marked as cooked!', 'success'),
        onError: () => showToast('Failed to mark as cooked. Please try again.', 'error'),
      }
    )
  }

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

  const isShareRef = searchParams.get('ref') === 'share'

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

      {planContext && (
        <div className="mb-4 bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">This Week's Plan</p>
            {weekProgress && (
              <p className="text-xs text-gray-500 mt-0.5">
                {weekProgress.cooked} of {weekProgress.total} meals cooked this week
              </p>
            )}
          </div>
          {alreadyCooked ? (
            <span className="flex items-center gap-1.5 px-4 py-2 bg-green-100 text-green-700 text-sm font-semibold rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Cooked
            </span>
          ) : (
            <button
              onClick={handleMarkCooked}
              disabled={markCooked.isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {markCooked.isPending ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              Mark as Cooked
            </button>
          )}
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
