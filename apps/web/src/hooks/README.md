# Custom Hooks

This directory contains custom React hooks that encapsulate complex logic and state management.

## Hooks

### useRecipeSave

**Location**: `useRecipeSave.ts`

**Purpose**: Manages recipe save/unsave functionality with loading states and error handling.

**Props**:
```typescript
interface UseRecipeSaveProps {
  userId?: string
  recipeId?: string
}
```

**Returns**:
```typescript
{
  isSaved: boolean
  isSaveLoading: boolean
  handleSaveClick: () => Promise<void>
}
```

**Features**:
- Automatically checks if recipe is saved on mount
- Handles save/unsave toggle with loading states
- Error handling for API calls
- Optimistic UI updates

**Usage**:
```tsx
const { isSaved, isSaveLoading, handleSaveClick } = useRecipeSave({
  userId: user?.id,
  recipeId: recipe.id
})
```

### useCookingAssistant

**Location**: `useCookingAssistant.ts`

**Purpose**: Manages the voice cooking assistant connection, state, and real-time session handling.

**Props**:
```typescript
interface UseCookingAssistantProps {
  recipe: any
  userId?: string
  canUseCookingAssistant: boolean
  onShowUpgradeModal: () => void
  onSessionsUsed: (sessionsUsed: number) => void
}
```

**Returns**:
```typescript
{
  isCookModeActive: boolean
  isConnecting: { loading: boolean; isConnected: boolean }
  error: string | null
  isMuted: boolean
  handleToggleCookMode: () => Promise<void>
  handleSetMute: (payload: boolean) => void
}
```

**Features**:
- Manages OpenAI Realtime API connection
- Handles ephemeral key generation
- Session usage tracking
- Error handling and recovery
- Automatic cleanup on unmount
- Optimistic UI updates

**Usage**:
```tsx
const {
  isCookModeActive,
  isConnecting,
  error,
  isMuted,
  handleToggleCookMode,
  handleSetMute
} = useCookingAssistant({
  recipe,
  userId: user?.id,
  canUseCookingAssistant,
  onShowUpgradeModal: () => setShowUpgradeModal(true),
  onSessionsUsed: (increment) => {
    setSessionsUsed(subscriptionStatus?.sessionsUsed ? subscriptionStatus.sessionsUsed + increment : increment)
  }
})
```

## Benefits

1. **Logic Reuse**: Complex logic can be shared across components
2. **Separation of Concerns**: UI components focus on rendering, hooks handle logic
3. **Testing**: Hooks can be tested independently using React Testing Library
4. **State Management**: Centralized state management for related functionality
5. **Error Handling**: Consistent error handling patterns
6. **Performance**: Optimized re-renders and cleanup
