import React from 'react'
import { RecipeIngredientsProps } from '../../../types'

/**
 * BAND-AID: Parses stringified JSON arrays from the backend.
 * Backend sometimes sends strings that are actually stringified JSON arrays.
 * 
 * @param item - String to check for stringified JSON
 * @returns Parsed array if valid JSON array, otherwise returns null
 */
const parseStringifiedJsonArray = (item: string): unknown[] | null => {
  const trimmed = item.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);
    // Only handle if it's an array (band-aid is specifically for stringified JSON arrays)
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Not valid JSON
  }

  return null;
}

/**
 * Recursively processes ingredients to handle:
 * - Nested arrays (flattens them)
 * - Stringified JSON arrays (parses and expands them)
 * - Strings (normalizes them)
 * 
 * @param item - Can be array, string, or other type
 * @returns Array of normalized ingredient strings
 */
const processIngredient = (item: unknown): string[] => {
  if (!item) return [];

  // Handle arrays - recursively process each item and flatten results
  if (Array.isArray(item)) {
    return item.flatMap(processIngredient);
  }

  // Handle strings
  if (typeof item === 'string') {
    // BAND-AID: Check if it's a stringified JSON array
    const parsed = parseStringifiedJsonArray(item);
    if (parsed) {
      // It was a stringified JSON array - recursively process it
      return processIngredient(parsed);
    }
    // Regular string - return trimmed if not empty
    const trimmed = item.trim();
    return trimmed ? [trimmed] : [];
  }

  // Handle other types - convert to string
  const trimmed = String(item).trim();
  return trimmed ? [trimmed] : [];
}

const RecipeIngredients: React.FC<RecipeIngredientsProps> = ({ ingredients }) => {
  // Handle null/undefined or empty array
  if (!ingredients || (Array.isArray(ingredients) && ingredients.length === 0)) {
    return null;
  }

  // Process all ingredients recursively (handles nested arrays and stringified JSON)
  const normalizedIngredients = processIngredient(ingredients);

  if (normalizedIngredients.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Ingredients
      </h2>
      <div className="bg-gray-50 rounded-lg p-4">
        <ul className="space-y-2">
          {normalizedIngredients.map((ingredient, index) => (
            <li key={index} className="flex items-start">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span className="text-gray-700">{ingredient}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default RecipeIngredients
