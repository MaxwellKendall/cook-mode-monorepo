# Page Structure

This directory contains the main pages of the application, refactored from a single monolithic DashboardPage into three focused, declarative pages.

## Pages

### HomePage
**File**: `HomePage.tsx`
**Purpose**: Displays the user's saved recipes and provides recipe entry functionality
**Route**: `/home` (previously `/dashboard`)

**Features**:
- Shows user's saved recipes in a grid layout
- Displays welcome state when no recipes are saved
- Includes recipe entry form for adding new recipes
- Handles recipe search and redirects to search results
- Manages user authentication and subscription status

**Key Components Used**:
- `DashboardHeader` - Navigation and user menu
- `RecipeEntrySection` - Form for adding/searching recipes
- `RecipeGrid` - Grid display of saved recipes
- `WelcomeState` - Empty state with onboarding content
- `FeedbackWidget` - Beta feedback collection

### RecipeDetailPage
**File**: `RecipeDetailPage.tsx`
**Purpose**: Displays a single recipe in detail with cooking assistant
**Route**: `/recipe/:recipeId`

**Features**:
- Fetches and displays individual recipe details
- Shows loading and error states
- Integrates with RecipeDisplay component for full recipe view
- Handles navigation back to home

**Key Components Used**:
- `RecipeDisplay` - Full recipe display with cooking assistant
- `LoadingState` - Loading indicator
- `ErrorState` - Error handling with retry option

### RecipeSearchResultsPage
**File**: `RecipeSearchResultsPage.tsx`
**Purpose**: Displays search results from recipe queries
**Route**: `/search-results`

**Features**:
- Shows search results in a grid layout
- Handles navigation from search state
- Manages save status for search result recipes
- Provides clear results functionality

**Key Components Used**:
- `RecipeGrid` - Grid display of search results
- `LoadingState` - Loading indicator for saved recipes

## Component Organization

### Dashboard Components
Located in `src/components/dashboard/`:

```
dashboard/
├── header/
│   ├── DashboardHeader.tsx      # Navigation and user menu
│   └── RecipeEntrySection.tsx   # Recipe entry form
├── content/
│   ├── LoadingState.tsx         # Loading indicators
│   ├── ErrorState.tsx          # Error handling
│   ├── RecipeGrid.tsx          # Recipe grid display
│   └── WelcomeState.tsx        # Empty state
├── feedback/
│   └── FeedbackWidget.tsx      # Beta feedback collection
└── index.ts                    # Barrel exports
```

## Benefits of New Structure

### 1. **Single Responsibility Principle**
- Each page has one clear purpose
- Components are focused on specific functionality
- Easier to understand and maintain

### 2. **Declarative Design**
- Pages clearly express their intent
- State management is localized to relevant pages
- Component composition is explicit

### 3. **Improved Navigation**
- Clear URL structure (`/home`, `/recipe/:id`, `/search-results`)
- Better user experience with dedicated pages
- Easier to implement deep linking

### 4. **Better Performance**
- Smaller bundle sizes per page
- Lazy loading opportunities
- Reduced complexity in individual components

### 5. **Enhanced Maintainability**
- Easier to debug specific functionality
- Simpler testing strategies
- Clear separation of concerns

## Migration Notes

### Routing Updates Needed
The routing configuration will need to be updated to use the new page structure:

```tsx
// Old routing
<Route path="/dashboard" element={<DashboardPage />} />
<Route path="/dashboard/:recipeId" element={<DashboardPage />} />

// New routing
<Route path="/home" element={<HomePage />} />
<Route path="/recipe/:recipeId" element={<RecipeDetailPage />} />
<Route path="/search-results" element={<RecipeSearchResultsPage />} />
```

### Navigation Updates
- Update navigation links to use `/home` instead of `/dashboard`
- Update recipe detail links to use `/recipe/:id` format
- Update search result navigation to use `/search-results`

### State Management
- Recipe fetching logic is now distributed across relevant pages
- Search results are passed via React Router state
- User authentication and subscription state remains global

## Future Enhancements

1. **Lazy Loading**: Implement code splitting for better performance
2. **Caching**: Add recipe caching to reduce API calls
3. **Error Boundaries**: Add error boundaries for better error handling
4. **Loading States**: Enhance loading states with skeletons
5. **SEO**: Add meta tags and structured data for better SEO
