# Types Module

This directory contains centralized TypeScript type definitions for the application, eliminating duplicate interfaces and ensuring consistency across components.

## Files

### `recipe.ts`
Contains all recipe-related type definitions:

#### Core Types
- **`Recipe`** - Main recipe interface used throughout the application
- **`RecipeData`** - Recipe data format expected by RecipeDisplay component
- **`RecipeNutrients`** - Nutrition information structure

#### Component Props
- **`RecipeDisplayProps`** - Props for RecipeDisplay component
- **`RecipeHeaderProps`** - Props for RecipeHeader component
- **`RecipeImageProps`** - Props for RecipeImage component
- **`RecipeTagsProps`** - Props for RecipeTags component
- **`RecipeIngredientsProps`** - Props for RecipeIngredients component
- **`RecipeInstructionsProps`** - Props for RecipeInstructions component
- **`RecipeNutritionProps`** - Props for RecipeNutrition component
- **`RecipeGridProps`** - Props for RecipeGrid component
- **`RecipeEntrySectionProps`** - Props for RecipeEntrySection component

#### Service Types
- **`RecipeExtractionRequest`** - Request format for recipe extraction
- **`RecipeExtractionResponse`** - Response format for recipe extraction
- **`RecipeByIdResponse`** - Response format for fetching recipe by ID
- **`RecipeSearchResponse`** - Response format for recipe search

### `index.ts`
Barrel export file that re-exports all types and commonly used service types.

### `global.d.ts`
Contains global TypeScript declarations for Web Speech API.

## Usage

### Importing Types

```typescript
// Import specific types
import { Recipe, RecipeDisplayProps } from '../types'

// Import all types
import * as Types from '../types'

// Import from barrel export
import { Recipe, UserTag } from '../types'
```

### Example Usage

```typescript
import React from 'react'
import { Recipe, RecipeGridProps } from '../types'

const RecipeGrid: React.FC<RecipeGridProps> = ({ recipes, title }) => {
  return (
    <div>
      <h2>{title}</h2>
      {recipes.map((recipe: Recipe) => (
        <div key={recipe.id}>{recipe.title}</div>
      ))}
    </div>
  )
}
```

## Benefits

### 1. **Consistency**
- Single source of truth for all recipe-related types
- Ensures all components use the same data structure
- Reduces type mismatches and runtime errors

### 2. **Maintainability**
- Changes to types only need to be made in one place
- Easy to find and update type definitions
- Clear separation of concerns

### 3. **Developer Experience**
- Better IntelliSense and autocomplete
- Compile-time type checking
- Easier refactoring with TypeScript

### 4. **Code Quality**
- Eliminates duplicate interface definitions
- Reduces bundle size
- Improves code organization

## Migration Notes

### Before (Duplicate Interfaces)
```typescript
// In RecipeSearchResultsPage.tsx
interface Recipe {
  id?: string
  title: string
  // ... duplicate definition
}

// In HomePage.tsx
interface Recipe {
  id?: string
  title: string
  // ... duplicate definition
}
```

### After (Centralized Types)
```typescript
// In RecipeSearchResultsPage.tsx
import { Recipe } from '../types'

// In HomePage.tsx
import { Recipe } from '../types'
```

## Best Practices

### 1. **Always Import from Types Module**
```typescript
// ✅ Good
import { Recipe } from '../types'

// ❌ Bad
interface Recipe { ... } // Don't redefine
```

### 2. **Use Specific Imports**
```typescript
// ✅ Good
import { Recipe, RecipeDisplayProps } from '../types'

// ❌ Avoid (unless you need many types)
import * as Types from '../types'
```

### 3. **Extend Types When Needed**
```typescript
// ✅ Good - extend existing types
interface ExtendedRecipe extends Recipe {
  customField: string
}

// ❌ Bad - redefine existing types
interface Recipe { ... }
```

### 4. **Keep Types Focused**
- Each type should have a single responsibility
- Avoid overly complex nested types
- Use composition over inheritance when possible

## Future Enhancements

1. **Validation Types**: Add runtime validation types using libraries like Zod
2. **API Types**: Centralize all API request/response types
3. **Form Types**: Add form-specific types for validation
4. **State Types**: Add Redux/Zustand state types
5. **Utility Types**: Add common utility types for the application
