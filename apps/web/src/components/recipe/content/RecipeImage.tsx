import React from 'react'
import { RecipeImageProps } from '../../../types'

const RecipeImage: React.FC<RecipeImageProps> = ({ imageUrl, title }) => {
  if (!imageUrl) {
    return null
  }

  return (
    <div className="mb-8">
      <img
        src={imageUrl}
        alt={`${title} - Recipe image`}
        className="w-full h-64 object-cover rounded-lg shadow-sm"
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />
    </div>
  )
}

export default RecipeImage
