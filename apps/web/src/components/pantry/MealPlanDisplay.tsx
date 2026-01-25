import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { MealPlan, MealPlanRecipe } from '../../services/pantryService';

type DisplayMode = 'review' | 'accepted';

interface MealPlanDisplayProps {
  mealPlan: MealPlan;
  mode?: DisplayMode;
  onAccept?: () => void;
  onRegenerate?: () => void;
  onStartOver?: () => void;
  onComplete?: () => void;
  isAccepting?: boolean;
}

const MEAL_LABELS = {
  now: { title: 'Make Now', subtitle: 'Ready to cook', color: 'from-green-500 to-emerald-600' },
  next: { title: 'Make Next', subtitle: 'Plan for soon', color: 'from-blue-500 to-indigo-600' },
  later: { title: 'Make Later', subtitle: 'Save for later', color: 'from-purple-500 to-violet-600' },
};

interface MealCardProps {
  slot: 'now' | 'next' | 'later';
  recipe: MealPlanRecipe;
}

const MealCard: React.FC<MealCardProps> = ({ slot, recipe }) => {
  const navigate = useNavigate();
  const label = MEAL_LABELS[slot];

  return (
    <div
      onClick={() => navigate(`/${recipe.recipeId}`)}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 group"
    >
      {/* Header Badge */}
      <div className={`px-4 py-2 bg-gradient-to-r ${label.color} text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">{label.title}</p>
            <p className="text-sm opacity-90">{label.subtitle}</p>
          </div>
          {recipe.fromSavedRecipes && (
            <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
              From Saved
            </span>
          )}
        </div>
      </div>

      {/* Recipe Image */}
      <div className="relative h-40 bg-gray-100">
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
          {recipe.title}
        </h3>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{recipe.reasoning}</p>

        {/* Time Info */}
        {(recipe.prepTime || recipe.cookTime) && (
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
            {recipe.prepTime && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Prep: {recipe.prepTime}
              </span>
            )}
            {recipe.cookTime && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Cook: {recipe.cookTime}
              </span>
            )}
          </div>
        )}

        {/* Ingredient Match */}
        <div className="space-y-2">
          {recipe.matchedIngredients.length > 0 && (
            <div>
              <p className="text-xs font-medium text-green-700 mb-1">
                Using your ingredients:
              </p>
              <div className="flex flex-wrap gap-1">
                {recipe.matchedIngredients.slice(0, 5).map((ing) => (
                  <span
                    key={ing}
                    className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs capitalize"
                  >
                    {ing}
                  </span>
                ))}
                {recipe.matchedIngredients.length > 5 && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                    +{recipe.matchedIngredients.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

          {recipe.missingIngredients.length > 0 && (
            <div>
              <p className="text-xs font-medium text-orange-700 mb-1">You'll need:</p>
              <div className="flex flex-wrap gap-1">
                {recipe.missingIngredients.slice(0, 3).map((ing) => (
                  <span
                    key={ing}
                    className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs capitalize"
                  >
                    {ing}
                  </span>
                ))}
                {recipe.missingIngredients.length > 3 && (
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">
                    +{recipe.missingIngredients.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Recipe Button */}
      <div className="px-4 pb-4">
        <button className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm">
          View Recipe
        </button>
      </div>
    </div>
  );
};

const MealPlanDisplay: React.FC<MealPlanDisplayProps> = ({
  mealPlan,
  mode = 'review',
  onAccept,
  onRegenerate,
  onStartOver,
  onComplete,
  isAccepting = false,
}) => {
  const isReviewMode = mode === 'review';
  const isAcceptedMode = mode === 'accepted';

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div
          className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
            isAcceptedMode
              ? 'bg-gradient-to-br from-green-500 to-emerald-600'
              : 'bg-gradient-to-br from-blue-500 to-indigo-600'
          }`}
        >
          {isAcceptedMode ? (
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          )}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isAcceptedMode ? 'Your Active Meal Plan' : 'Your Meal Plan is Ready!'}
        </h2>
        <p className="text-gray-600">
          {isAcceptedMode
            ? 'Click on a recipe to start cooking'
            : 'Review and accept this plan, or regenerate for different options'}
        </p>
      </div>

      {/* Meal Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <MealCard slot="now" recipe={mealPlan.now} />
        <MealCard slot="next" recipe={mealPlan.next} />
        <MealCard slot="later" recipe={mealPlan.later} />
      </div>

      {/* Actions - Review Mode */}
      {isReviewMode && (
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={onRegenerate}
            disabled={isAccepting}
            className="px-6 py-3 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Regenerate Plan
            </span>
          </button>
          <button
            onClick={onAccept}
            disabled={isAccepting}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center justify-center gap-2">
              {isAccepting ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Accept Plan
                </>
              )}
            </span>
          </button>
        </div>
      )}

      {/* Actions - Accepted Mode */}
      {isAcceptedMode && (
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={onStartOver}
            className="px-6 py-3 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create New Plan
            </span>
          </button>
          <button
            onClick={onComplete}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-colors"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Mark as Completed
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MealPlanDisplay;
