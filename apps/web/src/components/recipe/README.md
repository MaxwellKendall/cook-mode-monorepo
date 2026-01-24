# Recipe Components

This directory contains the organized components for the RecipeDisplay functionality, broken down from the original monolithic component.

## Structure

```
recipe/
├── header/
│   └── RecipeHeader.tsx          # Recipe title, description, metadata, and save button
├── content/
│   ├── RecipeImage.tsx           # Recipe image display
│   ├── RecipeTags.tsx            # Recipe tags (cuisine, difficulty, user tags)
│   ├── RecipeIngredients.tsx     # Ingredients list
│   ├── RecipeInstructions.tsx    # Step-by-step instructions
│   └── RecipeNutrition.tsx       # Nutrition information
├── assistant/
│   └── CookingAssistant.tsx      # Voice cooking assistant controls
└── index.ts                      # Barrel exports for clean imports
```

## Components

### RecipeHeader
- Displays recipe title, description, and metadata (prep time, cook time, servings)
- Handles back navigation and save/unsave functionality
- Props: `recipe`, `onBack`, `onSave`, `isSaved`, `isSaveLoading`, `showSaveButton`

### RecipeImage
- Displays recipe image with error handling
- Props: `image`, `title`

### RecipeTags
- Displays all types of recipe tags (cuisine, difficulty, standard tags, user tags)
- Props: `cuisine`, `difficulty`, `tags`, `user_tags`

### RecipeIngredients
- Displays ingredients list with bullet points
- Props: `ingredients`

### RecipeInstructions
- Displays step-by-step instructions with numbered steps
- Props: `instructions`

### RecipeNutrition
- Displays nutrition information as tags
- Props: `nutrients`

### CookingAssistant
- Handles voice cooking assistant toggle and controls
- Props: `isCookModeActive`, `isConnecting`, `canUseCookingAssistant`, `error`, `isMuted`, `onToggleCookMode`, `onMuteToggle`, `onShowUpgradeModal`, `renderSessionStatus`

## Hooks

### useRecipeSave
Located in `src/hooks/useRecipeSave.ts`
- Manages recipe save/unsave functionality
- Returns: `isSaved`, `isSaveLoading`, `handleSaveClick`

### useCookingAssistant
Located in `src/hooks/useCookingAssistant.ts`
- Manages cooking assistant connection and state
- Returns: `isCookModeActive`, `isConnecting`, `error`, `isMuted`, `handleToggleCookMode`, `handleSetMute`

## Usage

```tsx
import {
  RecipeHeader,
  RecipeImage,
  RecipeTags,
  RecipeIngredients,
  RecipeInstructions,
  RecipeNutrition,
  CookingAssistant
} from './recipe'
```

## Benefits

1. **Separation of Concerns**: Each component has a single responsibility
2. **Reusability**: Components can be reused in other parts of the application
3. **Maintainability**: Easier to debug and modify individual features
4. **Testability**: Each component can be tested in isolation
5. **Performance**: Smaller components can be optimized individually
6. **Code Organization**: Related functionality is grouped together
