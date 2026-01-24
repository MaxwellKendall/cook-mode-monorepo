import React from 'react'
import { VoiceFlowTheme } from '../../lib/theme'
import { RecipeFull } from '../../types/api'

interface CompactRecipeDisplayProps {
  recipe: RecipeFull
  theme: VoiceFlowTheme
}

/**
 * Compact recipe display optimized for the voice flow
 * Shows essential info without overwhelming the voice interaction
 */
const CompactRecipeDisplay: React.FC<CompactRecipeDisplayProps> = ({
  recipe,
  theme,
}) => {
  return (
    <div 
      className="overflow-y-auto"
      style={{ backgroundColor: theme.surface }}
    >
      {/* Recipe header */}
      <div className="px-4 py-4 border-b" style={{ borderColor: theme.border }}>
        <div className="flex items-start space-x-4">
          {/* Image */}
          {recipe.imageUrl && (
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
            />
          )}
          
          <div className="flex-1 min-w-0">
            <h2 
              className="text-lg font-semibold truncate"
              style={{ color: theme.text }}
            >
              {recipe.title}
            </h2>
            
            {/* Quick stats */}
            <div className="mt-1 flex flex-wrap gap-2 text-sm" style={{ color: theme.textMuted }}>
              {recipe.totalTime && (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {recipe.totalTime}
                </span>
              )}
              {recipe.servings && (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {recipe.servings}
                </span>
              )}
              {recipe.difficulty && (
                <span 
                  className="px-2 py-0.5 rounded-full text-xs"
                  style={{ 
                    backgroundColor: theme.primaryLight,
                    color: theme.primaryDark,
                  }}
                >
                  {recipe.difficulty}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Collapsible sections */}
      <div className="divide-y" style={{ borderColor: theme.border }}>
        {/* Ingredients */}
        <details className="group" open>
          <summary 
            className="px-4 py-3 cursor-pointer flex items-center justify-between hover:bg-opacity-50"
            style={{ color: theme.text }}
          >
            <span className="font-medium">
              Ingredients ({recipe.ingredients?.length || 0})
            </span>
            <svg 
              className="w-5 h-5 transition-transform group-open:rotate-180" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <ul className="px-4 pb-3 space-y-1.5">
            {recipe.ingredients?.map((ingredient, idx) => (
              <li 
                key={idx}
                className="flex items-start text-sm"
                style={{ color: theme.textMuted }}
              >
                <span 
                  className="w-1.5 h-1.5 rounded-full mt-1.5 mr-2 flex-shrink-0"
                  style={{ backgroundColor: theme.primary }}
                />
                {ingredient}
              </li>
            ))}
          </ul>
        </details>
        
        {/* Instructions */}
        <details className="group">
          <summary 
            className="px-4 py-3 cursor-pointer flex items-center justify-between hover:bg-opacity-50"
            style={{ color: theme.text }}
          >
            <span className="font-medium">
              Instructions ({recipe.instructions?.length || 0} steps)
            </span>
            <svg 
              className="w-5 h-5 transition-transform group-open:rotate-180" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <ol className="px-4 pb-3 space-y-3">
            {recipe.instructions?.map((instruction, idx) => (
              <li 
                key={idx}
                className="flex items-start text-sm"
                style={{ color: theme.textMuted }}
              >
                <span 
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-3"
                  style={{ 
                    backgroundColor: theme.primaryLight,
                    color: theme.primaryDark,
                  }}
                >
                  {idx + 1}
                </span>
                <span className="pt-0.5">{instruction}</span>
              </li>
            ))}
          </ol>
        </details>
      </div>
    </div>
  )
}

export default CompactRecipeDisplay
