import { useState, useEffect } from 'react'
import { saveRecipeForUser, removeSavedRecipe, isRecipeSavedForUser } from '../services/recipeService'

interface UseRecipeSaveProps {
  userId?: string
  recipeId?: string
}

export const useRecipeSave = ({ userId, recipeId }: UseRecipeSaveProps) => {
  const [isSaved, setIsSaved] = useState(false)
  const [isSaveLoading, setIsSaveLoading] = useState(false)

  // Check if recipe is saved when component mounts
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!userId || !recipeId) return
      
      try {
        const response = await isRecipeSavedForUser(userId, recipeId)
        if (response.is_saved) {
          setIsSaved(response.is_saved)
        }
      } catch (error) {
        console.error('Error checking if recipe is saved:', error)
      }
    }

    checkIfSaved()
  }, [userId, recipeId])

  const handleSaveClick = async () => {
    if (!userId || !recipeId || isSaveLoading) return

    setIsSaveLoading(true)
    try {
      if (isSaved) {
        const response = await removeSavedRecipe(userId, recipeId)
        if (response.success) {
          setIsSaved(false)
        }
      } else {
        const response = await saveRecipeForUser(userId, recipeId)
        if (response.success) {
          setIsSaved(true)
        }
      }
    } catch (error) {
      console.error('Error toggling save status:', error)
    } finally {
      setIsSaveLoading(false)
    }
  }

  return {
    isSaved,
    isSaveLoading,
    handleSaveClick
  }
}
