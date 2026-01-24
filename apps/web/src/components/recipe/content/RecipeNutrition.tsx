import React from 'react'
import { RecipeNutritionProps } from '../../../types'

const NUTRIENT_DESCRIPTORS = {
  calories: 'cal',
  proteinContent: 'protien',
  carbohydrateContent: 'carbs',
  fatContent: 'fat',
  fiberContent: 'fiber',
  sugarContent: 'sugar',
  sodiumContent: 'sodium',
  cholesterolContent: 'cholesterol',
  saturatedFatContent: 'saturated fat',
  unsaturatedFatContent: 'unsaturated fat',
}

const extractNutrientValue = (raw: string, descriptor: string) => {
  const parts = raw ? raw.split(' ') : [];
  if (!descriptor) return null;
  if (parts.length >= 2) {
    return `${parts[0]}${parts[1]} ${descriptor}`
  }
  return null
}

const RecipeNutrition: React.FC<RecipeNutritionProps> = ({ nutrients }) => {
  if (!nutrients) {
    return null
  }

  const nutrientValues = Object.entries(nutrients).map(([key, value]) => 
    extractNutrientValue(value, NUTRIENT_DESCRIPTORS[key])
  ).filter((value) => value !== null)

  if (nutrientValues.length === 0) {
    return null
  }

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Nutrition Information</h3>
      <div className="flex flex-wrap gap-2">
        {nutrientValues.map((nutrient) => (
          <span key={nutrient} className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
            {nutrient}
          </span>
        ))}
      </div>
    </div>
  )
}

export default RecipeNutrition
