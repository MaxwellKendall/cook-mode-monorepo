import React from 'react'
import { useNavigate } from 'react-router-dom'

const PlanCTA: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-6 mb-6 text-center">
      <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-1">Plan Your Week</h2>
      <p className="text-sm text-gray-600 mb-4">
        Get a personalized meal plan and grocery list in 60 seconds
      </p>
      <button
        onClick={() => navigate('/plan')}
        className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors shadow-sm text-sm"
      >
        Start Planning →
      </button>
    </div>
  )
}

export default PlanCTA
