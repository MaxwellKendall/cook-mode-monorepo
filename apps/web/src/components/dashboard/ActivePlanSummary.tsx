import React from 'react'
import { useNavigate } from 'react-router-dom'
import type { WeeklyPlan } from '../../services/weeklyPlanService'
import type { GroceryList } from '../../services/groceryListService'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface ActivePlanSummaryProps {
  plan: WeeklyPlan
  groceryList?: GroceryList
}

const ActivePlanSummary: React.FC<ActivePlanSummaryProps> = ({ plan, groceryList }) => {
  const navigate = useNavigate()
  const meals = [...(plan.meals ?? [])].sort((a, b) => a.day - b.day)

  // Find today's meal: day of week 1=Mon…7=Sun
  const todayDow = new Date().getDay() // 0=Sun…6=Sat
  const todayPlanDay = todayDow === 0 ? 7 : todayDow // convert to 1=Mon…7=Sun
  const todayMeal = meals.find((m) => m.day === todayPlanDay) ?? meals[0]

  const cookedCount = meals.filter((m) => m.cookedAt).length

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">This Week's Plan</h2>
          <span className="text-xs text-gray-500">{cookedCount}/{meals.length} cooked</span>
        </div>

        {/* Day progress tabs */}
        <div className="flex gap-1.5 mt-3 overflow-x-auto">
          {meals.map((meal) => {
            const label = DAY_NAMES[(meal.day - 1) % 7]
            const isToday = meal.day === todayPlanDay
            const isCooked = !!meal.cookedAt

            return (
              <button
                key={meal.day}
                onClick={() => navigate(`/plan/${plan.id}`)}
                className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  isCooked
                    ? 'bg-green-100 text-green-700'
                    : isToday
                    ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-300'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {isCooked ? `${label}✓` : isToday ? `${label}→` : label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Today's meal */}
      {todayMeal && (
        <div className="p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3 font-medium">
            {todayMeal.day === todayPlanDay ? "Today's Dinner" : 'Next Up'}
          </p>
          <div className="flex gap-4">
            {/* Thumbnail */}
            <button
              onClick={() => navigate(`/${todayMeal.recipeId}?planId=${plan.id}&day=${todayMeal.day}`)}
              className="flex-shrink-0"
            >
              {todayMeal.imageUrl ? (
                <img
                  src={todayMeal.imageUrl}
                  alt={todayMeal.title}
                  className="w-20 h-20 object-cover rounded-xl"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
                  <span className="text-3xl">🍽️</span>
                </div>
              )}
            </button>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-1">
                {todayMeal.title}
              </h3>
              {todayMeal.cookTime && (
                <p className="text-xs text-gray-400 flex items-center gap-1 mb-3">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {todayMeal.cookTime}m
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => navigate(`/${todayMeal.recipeId}?planId=${plan.id}&day=${todayMeal.day}`)}
                  className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Start Cooking →
                </button>
                {groceryList && (
                  <button
                    onClick={() => navigate(`/grocery/${groceryList.id}`)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Grocery {groceryList.progress.checked}/{groceryList.progress.total} ✓
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ActivePlanSummary
