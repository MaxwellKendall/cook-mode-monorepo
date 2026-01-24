import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { MealPlan, MealPlanRecipe } from '../../services/pantryService';

interface MealPlanDisplayProps {
  mealPlan: MealPlan;
  onStartOver: () => void;
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

const MealPlanDisplay: React.FC<MealPlanDisplayProps> = ({ mealPlan, onStartOver }) => {
  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Meal Plan is Ready!</h2>
        <p className="text-gray-600">
          Here are 3 recipes based on your ingredients
        </p>
      </div>

      {/* Meal Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <MealCard slot="now" recipe={mealPlan.now} />
        <MealCard slot="next" recipe={mealPlan.next} />
        <MealCard slot="later" recipe={mealPlan.later} />
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <button
          onClick={onStartOver}
          className="px-6 py-3 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Start Over
          </span>
        </button>
      </div>
    </div>
  );
};

export default MealPlanDisplay;
