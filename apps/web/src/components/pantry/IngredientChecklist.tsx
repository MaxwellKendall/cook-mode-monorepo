import React, { useState, useEffect, useMemo } from 'react';
import type { ParsedIngredient } from '../../services/pantryService';

interface IngredientChecklistProps {
  ingredients: ParsedIngredient[];
  onSubmit: (selectedIngredients: string[]) => void;
  isSubmitting: boolean;
}

const CATEGORY_ORDER = ['produce', 'protein', 'dairy', 'pantry', 'spices', 'other'];

const CATEGORY_COLORS: Record<string, string> = {
  produce: 'bg-green-100 text-green-800',
  protein: 'bg-red-100 text-red-800',
  dairy: 'bg-yellow-100 text-yellow-800',
  pantry: 'bg-orange-100 text-orange-800',
  spices: 'bg-purple-100 text-purple-800',
  other: 'bg-gray-100 text-gray-800',
};

const CATEGORY_LABELS: Record<string, string> = {
  produce: 'Produce',
  protein: 'Protein',
  dairy: 'Dairy',
  pantry: 'Pantry Staples',
  spices: 'Spices & Seasonings',
  other: 'Other',
};

const IngredientChecklist: React.FC<IngredientChecklistProps> = ({
  ingredients,
  onSubmit,
  isSubmitting,
}) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newIngredient, setNewIngredient] = useState('');
  const [manualIngredients, setManualIngredients] = useState<ParsedIngredient[]>([]);

  // Combine parsed and manual ingredients
  const allIngredients = useMemo(() => {
    return [...ingredients, ...manualIngredients];
  }, [ingredients, manualIngredients]);

  // Initialize all ingredients as selected
  useEffect(() => {
    setSelected(new Set(ingredients.map((i) => i.name)));
  }, [ingredients]);

  const toggleIngredient = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(allIngredients.map((i) => i.name)));
    } else {
      setSelected(new Set());
    }
  };

  const handleAddIngredient = () => {
    const trimmed = newIngredient.trim().toLowerCase();
    if (!trimmed) return;

    // Check if ingredient already exists
    const exists = allIngredients.some((i) => i.name.toLowerCase() === trimmed);
    if (exists) {
      // If it exists but is not selected, select it
      setSelected((prev) => new Set([...prev, trimmed]));
      setNewIngredient('');
      return;
    }

    const ingredient: ParsedIngredient = {
      name: trimmed,
      confidence: 1.0,
      category: 'other',
    };

    setManualIngredients((prev) => [...prev, ingredient]);
    setSelected((prev) => new Set([...prev, trimmed]));
    setNewIngredient('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddIngredient();
    }
  };

  const handleSubmit = () => {
    onSubmit(Array.from(selected));
  };

  // Group ingredients by category
  const groupedIngredients = allIngredients.reduce(
    (acc, ingredient) => {
      const category = ingredient.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(ingredient);
      return acc;
    },
    {} as Record<string, ParsedIngredient[]>
  );

  // Sort categories
  const sortedCategories = Object.keys(groupedIngredients).sort(
    (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b)
  );

  const allSelected = selected.size === allIngredients.length;
  const someSelected = selected.size > 0 && selected.size < allIngredients.length;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {allIngredients.length} Ingredients
                {manualIngredients.length > 0 && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({manualIngredients.length} added manually)
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-600">
                Uncheck any items you don't want to use
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={(e) => toggleAll(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Select All</span>
            </label>
          </div>

          {/* Add Ingredient Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newIngredient}
              onChange={(e) => setNewIngredient(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add an ingredient..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <button
              onClick={handleAddIngredient}
              disabled={!newIngredient.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add
            </button>
          </div>
        </div>

        {/* Ingredient List */}
        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
          {sortedCategories.map((category) => (
            <div key={category} className="px-6 py-4">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[category] || CATEGORY_COLORS.other}`}
                >
                  {CATEGORY_LABELS[category] || category}
                </span>
                <span className="text-sm text-gray-500">
                  ({groupedIngredients[category].length})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {groupedIngredients[category].map((ingredient) => (
                  <label
                    key={ingredient.name}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg cursor-pointer
                      transition-colors duration-150
                      ${selected.has(ingredient.name)
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(ingredient.name)}
                      onChange={() => toggleIngredient(ingredient.name)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium capitalize truncate ${
                          selected.has(ingredient.name)
                            ? 'text-gray-900'
                            : 'text-gray-500 line-through'
                        }`}
                      >
                        {ingredient.name}
                      </p>
                      {ingredient.quantity && (
                        <p className="text-xs text-gray-500">{ingredient.quantity}</p>
                      )}
                    </div>
                    {ingredient.confidence >= 0.9 && (
                      <svg
                        className="w-4 h-4 text-green-500 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {selected.size} of {allIngredients.length} ingredients selected
            </p>
            <button
              onClick={handleSubmit}
              disabled={selected.size === 0 || isSubmitting}
              className={`
                px-6 py-3 rounded-lg font-medium transition-all
                ${selected.size === 0 || isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                }
              `}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
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
                  Generating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Generate Meal Plan
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IngredientChecklist;
