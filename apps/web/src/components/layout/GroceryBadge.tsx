import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useWeeklyPlans } from '../../hooks/queries/useWeeklyPlan'
import { useGroceryListByPlan } from '../../hooks/queries/useGroceryList'

const GroceryBadge: React.FC = () => {
  const navigate = useNavigate()
  const { user, session } = useAuth()
  const token = session?.access_token

  const { data: plans } = useWeeklyPlans(user?.id, 'active', token)
  const activePlan = plans?.[0]

  const { data: groceryList } = useGroceryListByPlan(activePlan?.id, token)

  const uncheckedCount = groceryList
    ? groceryList.sections.reduce(
        (sum, section) => sum + section.items.filter((item) => !item.checked).length,
        0
      )
    : 0

  const handleClick = () => {
    if (groceryList) {
      navigate(`/grocery/${groceryList.id}`)
    } else {
      navigate('/plan')
    }
  }

  return (
    <button
      onClick={handleClick}
      className="relative p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
      title="Grocery List"
    >
      <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      {uncheckedCount > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
          {uncheckedCount > 99 ? '99+' : uncheckedCount}
        </span>
      )}
    </button>
  )
}

export default GroceryBadge
