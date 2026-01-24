import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCheck, faPlus, faTrash, faTag, faSpinner, faMinus } from '@fortawesome/free-solid-svg-icons';
import { formatHashtagName, isValidHashtagName, UserTag } from '../services/tagService';
import { useAuth } from '../contexts/AuthContext';
import { useUserTags } from '../hooks/queries';
import { useApplyTag, useRemoveTag, useCreateAndApplyTag, useDeleteTag } from '../hooks/mutations';
import { RecipeBase, RecipeWithUserData } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { usePostHog } from '@posthog/react';
import { POSTHOG_EVENTS } from '../lib/posthogEvents';

interface TagManagerProps {
  recipe: RecipeBase | RecipeWithUserData;
  loading?: boolean;
  className?: string;
  compact?: boolean; // New prop to control display mode
}

const TagManager: React.FC<TagManagerProps> = ({
  recipe,
  loading = false,
  className = "",
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [creating, setCreating] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<UserTag | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get user for auth
  const { user } = useAuth();
  const posthog = usePostHog();

  // Get user tags from React Query
  const { data: allUserTags = [], isLoading: userTagsLoading } = useUserTags(user?.id);

  // Get mutation hooks
  const applyTag = useApplyTag();
  const removeTag = useRemoveTag();
  const createAndApplyTag = useCreateAndApplyTag();
  const deleteTagMutation = useDeleteTag();
  
  // Get recipe ID and applied tags from the recipe prop
  const recipeId = recipe.id;
  const appliedTags = 'userTags' in recipe ? recipe.userTags : [];
  
  // Helper to check if a tag operation is loading
  const isTagLoading = (tag: UserTag) => {
    return applyTag.isPending || removeTag.isPending;
  }

  const isDeletingTag = (tagId: string) => deleteTagMutation.isPending;
  const isCreatingTag = () => createAndApplyTag.isPending;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setInputValue('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleCreateOrApplyTag();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setInputValue('');
    }
  };

  const handleCreateOrApplyTag = async () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || !isValidHashtagName(trimmedValue)) return;

    const formattedName = formatHashtagName(trimmedValue);
    
    // Check if tag already exists in all user tags
    const existingTag = allUserTags.find(tag => tag.name === formattedName);
    
    if (existingTag) {
      // Apply existing tag
      await handleApplyTag(existingTag);
    } else {
      // Create new tag and apply it
      await handleCreateAndApplyTag(formattedName);
    }
    
    setInputValue('');
  };

  const handleCreateAndApplyTag = async (tagName: string) => {
    if (!user) return;
    
    setCreating(true);
    
    try {
      await createAndApplyTag.mutateAsync({
        userId: user.id,
        recipeId,
        tagName
      });
      
      // Track recipe tagged event
      posthog?.capture(POSTHOG_EVENTS.recipeTagged, {
        tagName: tagName,
        recipeId: recipeId,
        recipeTitle: 'title' in recipe ? recipe.title : undefined,
        action: 'created_and_applied',
      });
    } catch (error) {
      console.error('Error creating and applying tag:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleApplyTag = async (tag: UserTag) => {
    if (!user) return;
    
    try {
      await applyTag.mutateAsync({
        userId: user.id,
        recipeId,
        tagId: tag.id
      });
      
      // Track recipe tagged event
      posthog?.capture(POSTHOG_EVENTS.recipeTagged, {
        tagName: tag.name,
        recipeId: recipeId,
        recipeTitle: 'title' in recipe ? recipe.title : undefined,
        action: 'applied',
      });
    } catch (error) {
      console.error('Error applying tag:', error);
    }
  };

  const handleRemoveTag = async (tag: UserTag) => {
    if (!user) return;
    
    try {
      await removeTag.mutateAsync({
        userId: user.id,
        recipeId,
        tagId: tag.id,
        usageCount: tag.usage_count // Pass usage count to avoid extra DB query
      });
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };

  const handleDeleteTag = async (tag: UserTag) => {
    if (!user) return;
    
    // Show confirmation modal
    setTagToDelete(tag);
  };

  const confirmDeleteTag = async () => {
    if (!user || !tagToDelete) return;

    try {
      await deleteTagMutation.mutateAsync({
        userId: user.id,
        tagId: tagToDelete.id
      });
      setTagToDelete(null);
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  // Show all tags that match the search, including applied ones
  const filteredTags = allUserTags.filter(tag => 
    tag && tag?.name?.toLowerCase()?.includes(inputValue.toLowerCase())
  );

  const isTagApplied = (tag: UserTag) => {
    return appliedTags.some(applied => applied.id === tag.id);
  };

  return (
    <div className={`relative flex items-center ${className}`} ref={containerRef}>
      {/* Tag Button - Always visible, positioned as icon button like heart/rating */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="bg-white bg-opacity-90 rounded-full p-2 transition-all duration-200 hover:bg-opacity-100 hover:scale-110"
        title={appliedTags.length > 0 ? "Manage hashtags" : "Add hashtag"}
      >
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      </button>

      {/* Applied Tags - Only show in non-compact mode */}
      {!compact && appliedTags.length > 0 && (
        <div className="flex flex-wrap gap-1 ml-2">
          {appliedTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"
            >
              {tag.name}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRemoveTag(tag);
                }}
                className="ml-1 hover:text-green-900"
              >
                <FontAwesomeIcon icon={faTimes} className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-w-xs">
          {/* Input */}
          <div className="p-3 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onClick={(e: React.MouseEvent<HTMLInputElement>) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(true);
              }}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type hashtag name..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Press Enter to create or apply tag
            </p>
          </div>

          {/* All Tags - Single List */}
          {loading ? (
            <div className="p-3 text-center text-sm text-gray-500">
              Loading tags...
            </div>
          ) : filteredTags.length > 0 ? (
            <div className="max-h-64 overflow-y-auto">
              {filteredTags.map((tag) => {
                const isApplied = isTagApplied(tag);
                return (
                  <div
                    key={tag.id}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      {isApplied ? (
                        <FontAwesomeIcon icon={faCheck} className="w-3 h-3 text-green-500" />
                      ) : (
                        <div className="w-3 h-3" />
                      )}
                  <span className="text-gray-900">{tag.name}</span>
                  {!!tag?.usage_count && (
                    <span className="text-xs text-gray-500">
                      {tag.usage_count} recipes
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  {isApplied ? (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveTag(tag);
                      }}
                      disabled={isTagLoading(tag)}
                      className={`p-1 text-gray-400 hover:text-red-500 transition-colors ${
                        isTagLoading(tag) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      title="Remove from recipe"
                    >
                      {isTagLoading(tag) ? (
                        <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />
                      ) : (
                        <FontAwesomeIcon icon={faMinus} className="w-3 h-3" />
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleApplyTag(tag);
                      }}
                      disabled={isTagLoading(tag)}
                      className={`p-1 text-gray-400 hover:text-green-500 transition-colors ${
                        isTagLoading(tag) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      title="Apply to recipe"
                    >
                      {isTagLoading(tag) ? (
                        <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />
                      ) : (
                        <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteTag(tag);
                    }}
                    disabled={isDeletingTag(tag.id)}
                    className={`p-1 text-gray-400 hover:text-red-600 transition-colors ${
                      isDeletingTag(tag.id) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title="Delete tag completely"
                  >
                    {isDeletingTag(tag.id) ? (
                      <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />
                    ) : (
                      <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                    )}
                  </button>
                </div>
                  </div>
                );
              })}
            </div>
          ) : inputValue.trim() && isValidHashtagName(inputValue.trim()) ? (
            <div className="p-3">
              <button
                onClick={() => handleCreateOrApplyTag()}
                disabled={creating || isCreatingTag()}
                className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200 flex items-center justify-center space-x-2"
                data-testid="create-tag-button"
              >
                {(creating || isCreatingTag()) ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
                    <span>Create "{formatHashtagName(inputValue.trim())}"</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-3 text-center text-sm text-gray-500">
              {inputValue.trim() ? 'Invalid hashtag name' : 'No tags found'}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Tag Deletion */}
      <ConfirmationModal
        isOpen={tagToDelete !== null}
        onClose={() => setTagToDelete(null)}
        onConfirm={confirmDeleteTag}
        title="Delete Tag"
        message={tagToDelete 
          ? `Are you sure you want to delete the tag "${tagToDelete.name}"? This will remove it from all recipes.`
          : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        isLoading={deleteTagMutation.isPending}
      />
    </div>
  );
};

export default TagManager;
