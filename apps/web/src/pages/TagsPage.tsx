import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useUserTags } from '../hooks/queries'
import LoadingState from '../components/dashboard/content/LoadingState'
import { UserTag } from '../types/api'
import { usePostHog } from '@posthog/react'
import { POSTHOG_EVENTS } from '../lib/posthogEvents'

const TagsPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: userTags = [], isLoading: userTagsLoading } = useUserTags(user?.id)
  const posthog = usePostHog()

  // Track tags page view
  useEffect(() => {
    if (!userTagsLoading && user) {
      posthog?.capture(POSTHOG_EVENTS.tagsPageViewed, {
        tagCount: userTags.length,
      })
    }
  }, [userTagsLoading, userTags.length, user, posthog])

  if (!user) {
    return <div>Please log in to view your tags</div>
  }

  if (userTagsLoading) {
    return <LoadingState message="Loading your tags..." />
  }

  const handleTagClick = (tag: UserTag) => {
    // Navigate to search page with hashtag filter
    navigate(`/search?q=${encodeURIComponent(tag.name)}&type=hashtag`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Recipe Collections</h1>
        <p className="text-gray-600">
          Browse your saved recipes organized by tags. Each tag is like a personal cookbook.
        </p>
      </div>
      
      {userTags.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {userTags.map(tag => (
            <Link
              key={tag.id}
              to={`/search?q=${encodeURIComponent(tag.name)}&type=hashtag`}
              className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
              onClick={() => handleTagClick(tag)}
            >
              <div className="text-center">
                <div 
                  className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-medium text-gray-900 mb-1">{tag.name}</h3>
                <p className="text-sm text-gray-500">
                  {tag.usage_count || 0} recipe{tag.usage_count !== 1 ? 's' : ''}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tags yet</h3>
          <p className="text-gray-600 mb-4">
            Start tagging your saved recipes to organize them into collections.
          </p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Browse Recipes
          </a>
        </div>
      )}
    </div>
  )
}

export default TagsPage