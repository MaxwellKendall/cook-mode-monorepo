import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons'
import { searchRecipes, extractRecipe } from '../../../services/recipeService'
import { useUserTags } from '../../../hooks/queries'
import { usePostHog } from '@posthog/react'
import { POSTHOG_EVENTS } from '../../../lib/posthogEvents'

interface HeaderSearchBarProps {
  userId?: string
  onSearchResults?: (recipes: any[]) => void
}

// Modern spinner component
const ModernSpinner: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <div className={`${className} animate-spin`}>
    <svg
      className="w-full h-full"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
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
  </div>
)

const HeaderSearchBar: React.FC<HeaderSearchBarProps> = ({ userId, onSearchResults }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: userTags = [] } = useUserTags(userId)
  const posthog = usePostHog()

  // Initialize search query from URL parameters
  useEffect(() => {
    const queryParam = searchParams.get('q')
    if (queryParam) {
      setSearchQuery(queryParam)
    }
  }, [searchParams])

  // Helper function to detect if input is a URL
  const isUrl = (text: string): boolean => {
    try {
      new URL(text)
      return true
    } catch {
      return false
    }
  }

  const performSearch = async (query: string) => {
    console.log('debug: performSearch called with query:', query)

    try {
      setIsLoading(true)
      setError(null)

      if (isUrl(query.trim())) {
        // Handle URL extraction
        const response = await extractRecipe(query.trim())
        
        if (response.success && response.recipe_id) {
          // Track recipe import event
          posthog?.capture(POSTHOG_EVENTS.recipeImported, {
            url: query.trim(),
            recipeId: response.recipe_id,
          })
          
          // Navigate directly to the recipe detail page
          navigate(`/${response.recipe_id}`)
          // Keep search query in text box for URL extraction
        } else {
          throw new Error(response.error || 'Failed to extract recipe')
        }
      } else {
        // Check if query contains hashtag pattern
        const hashtagMatch = query.trim().match(/^#(\w+)$/);
        
        if (hashtagMatch && userId) {
          // Handle hashtag search - filter saved recipes by tag
          const searchResponse = await searchRecipes(query.trim(), userId);
          
          if (searchResponse.success && searchResponse.data) {
            // Track recipe search event for hashtag searches
            posthog?.capture(POSTHOG_EVENTS.recipeSearched, {
              searchQuery: query.trim(),
              resultCount: searchResponse.data.length,
              searchType: 'hashtag',
            })
            
            // Navigate to search page with hashtag results
            const searchUrl = `/search?q=${encodeURIComponent(query.trim())}&type=hashtag`
            console.log('Navigating to:', searchUrl) // Debug log
            navigate(searchUrl, { replace: false });
          } else {
            throw new Error(searchResponse.error || 'Failed to search recipes')
          }
        } else {
          // Handle regular search
          const searchResponse = await searchRecipes(query.trim(), userId);
          
          if (searchResponse.success && searchResponse.data) {
            // Track recipe search event
            posthog?.capture(POSTHOG_EVENTS.recipeSearched, {
              searchQuery: query.trim(),
              resultCount: searchResponse.data.length,
              searchType: hashtagMatch ? 'hashtag' : 'regular',
            })
            
            // Transform recipes to match our interface
            const transformedRecipes = searchResponse.data.map(recipe => ({
              id: recipe.id,
              title: recipe.title,
              imageUrl: recipe.imageUrl,
              summary: recipe.summary,
              cuisine: recipe.cuisine,
              category: recipe.category,
              prepTime: recipe.prepTime,
              cookTime: recipe.cookTime,
              servings: recipe.servings,
              rating: recipe.rating,
              ratingCount: recipe.ratingCount,
            }))
            
            // Navigate to search page with regular results
            const searchUrl = `/search?q=${encodeURIComponent(query.trim())}`
            console.log('Navigating to:', searchUrl) // Debug log
            navigate(searchUrl, { replace: false });
          } else {
            throw new Error(searchResponse.error || 'Failed to search recipes')
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to process request: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowAutocomplete(false)
    performSearch(searchQuery)
  }

  const handleClear = () => {
    setSearchQuery('')
    setError(null)
    setShowAutocomplete(false)
    setSelectedIndex(-1)
    // Navigate back to home and clear URL parameters
    navigate('/', { replace: false })
  }

  const handleHashtagSelect = (tagName: string) => {
    setSearchQuery(tagName)
    setShowAutocomplete(false)
    setSelectedIndex(-1)
    performSearch(tagName)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showAutocomplete || visibleTags.length === 0) {
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < visibleTags.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : visibleTags.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < visibleTags.length) {
          handleHashtagSelect(visibleTags[selectedIndex].name)
        } else {
          // If no item is selected, submit the current query
          handleSubmit(e as any)
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowAutocomplete(false)
        setSelectedIndex(-1)
        break
    }
  }

  const visibleTags = useMemo(() => {
    if (!searchQuery.startsWith('#')) return []
    const query = searchQuery.toLowerCase()
    return userTags.filter(tag => tag.name.toLowerCase().includes(query))
  }, [userTags, searchQuery])

  // Reset selected index when visible tags change
  useEffect(() => {
    setSelectedIndex(-1)
  }, [visibleTags.length])

  return (
    <div className="relative w-full max-w-md">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSelectedIndex(-1) // Reset selection when typing
                if (!showAutocomplete) {
                  setShowAutocomplete(true)
                }
                if (error) {
                  setError(null)
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search recipes or paste URL..."
              className={`w-full pl-10 pr-10 py-2.5 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 transition-colors flex items-center ${
                isLoading 
                  ? 'border-blue-300 bg-blue-50' 
                  : 'border-gray-300'
              }`}
              disabled={isLoading}
              aria-expanded={showAutocomplete && visibleTags.length > 0}
              aria-autocomplete="list"
              role="combobox"
            />
          
          {/* Search icon */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
            <FontAwesomeIcon 
              icon={faSearch} 
              className={`w-4 h-4 transition-colors ${
                isLoading ? 'text-blue-500' : 'text-gray-400'
              }`} 
            />
          </div>
          
          {/* Loading spinner or Clear button */}
          {isLoading ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
              <ModernSpinner className="w-4 h-4 text-blue-500" />
            </div>
          ) : searchQuery ? (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <FontAwesomeIcon icon={faTimes} className="w-3 h-3" />
            </button>
          ) : null}
        </div>
      </form>

      {/* Hashtag Autocomplete */}
      {searchQuery.startsWith('#') && showAutocomplete && visibleTags.length > 0 && (
        <div 
          className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
          role="listbox"
          aria-label="Tag suggestions"
        >
          {visibleTags.map((tag, index) => (
            <button
              key={tag.id}
              className={`w-full px-3 py-2 text-left flex items-center gap-2 border-b border-gray-100 last:border-b-0 transition-colors ${
                index === selectedIndex 
                  ? 'bg-blue-50 text-blue-900' 
                  : 'hover:bg-gray-50 text-gray-900'
              }`}
              onClick={() => handleHashtagSelect(tag.name)}
              onMouseEnter={() => setSelectedIndex(index)}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <span className="text-sm">{tag.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute top-full left-0 mt-1 w-full bg-red-50 border border-red-200 rounded-lg p-2 z-50">
          <p className="text-xs text-red-800">{error}</p>
        </div>
      )}
    </div>
  )
}

export default HeaderSearchBar
