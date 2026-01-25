import React from 'react';
import type { SavedMealPlan } from '../../services/pantryService';
import MealPlanDisplay from './MealPlanDisplay';

interface ActivePlanViewProps {
  plan: SavedMealPlan;
  onBack: () => void;
  onComplete: () => void;
  onDelete: () => void;
  onCreateNew: () => void;
}

const ActivePlanView: React.FC<ActivePlanViewProps> = ({
  plan,
  onBack,
  onComplete,
  onDelete,
  onCreateNew,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="w-full">
      {/* Breadcrumb / Back Button */}
      <div className="max-w-6xl mx-auto mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to My Plans
        </button>
      </div>

      {/* Plan Meta Info */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    plan.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {plan.status === 'active' ? 'Active Plan' : 'Completed'}
                </span>
                {plan.completedAt && (
                  <span className="text-sm text-gray-500">
                    Completed on {formatDate(plan.completedAt)}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Created on {formatDate(plan.createdAt)} with {plan.ingredients.length} ingredients
              </p>
            </div>

            <div className="flex items-center gap-2">
              {plan.status === 'active' ? (
                <button
                  onClick={onComplete}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Mark Complete
                </button>
              ) : (
                <button
                  onClick={onCreateNew}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create New Plan
                </button>
              )}
              <button
                onClick={onDelete}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-red-100 hover:text-red-600 transition-colors text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete
              </button>
            </div>
          </div>

          {/* Ingredients Used */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-2">Ingredients used:</p>
            <div className="flex flex-wrap gap-2">
              {plan.ingredients.slice(0, 10).map((ingredient) => (
                <span
                  key={ingredient}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm capitalize"
                >
                  {ingredient}
                </span>
              ))}
              {plan.ingredients.length > 10 && (
                <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm">
                  +{plan.ingredients.length - 10} more
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Meal Plan Display */}
      <MealPlanDisplay
        mealPlan={plan.plan}
        mode="accepted"
        onStartOver={onCreateNew}
        onComplete={onComplete}
      />
    </div>
  );
};

export default ActivePlanView;
