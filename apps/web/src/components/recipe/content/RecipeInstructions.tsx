import React from 'react'
import { RecipeInstructionsProps } from '../../../types'

const RecipeInstructions: React.FC<RecipeInstructionsProps> = ({ instructions }) => {
  if (!instructions || instructions.length === 0) {
    return null
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Instructions
      </h2>
      <div className="space-y-4">
        {instructions.map((instruction, index) => (
          <div key={index} className="flex bg-white border border-gray-200 rounded-lg p-4">
            <span className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-4 flex-shrink-0">
              {index + 1}
            </span>
            <p className="text-gray-700 text-left leading-relaxed pt-1">{instruction}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RecipeInstructions
