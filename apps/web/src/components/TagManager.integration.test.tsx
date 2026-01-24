import * as React from 'react'
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { handlers } from '../test/mocks/handlers'
import { ComponentTestWrapper, mockAuthContext, mockSubscriptionContext } from '../test/utils/component-test-wrapper'
import RecipeDetailPage from '../pages/RecipeDetailPage'
import { createMockUserTag } from '../test/mocks'

const API_URL = process.env.VITE_API_URL || 'http://localhost:8000'
const server = setupServer(...handlers)

// Mock the contexts
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}))

vi.mock('../contexts/SubscriptionContext', () => ({
  useSubscription: () => mockSubscriptionContext,
}))

beforeAll(() => server.listen())
afterAll(() => server.close())
beforeEach(() => server.resetHandlers())

describe('TagManager Integration Tests', () => {
  describe.skip('Scenario 1: Create new tag and apply it', () => {
    beforeEach(() => {
      render(
        <ComponentTestWrapper initialEntries={['/recipe/saved_recipe_id']}>
          <Routes>
            <Route path="/recipe/:recipeId" element={<RecipeDetailPage />} />
          </Routes>
        </ComponentTestWrapper>
      )
    })

    it('opens tag manager and shows existing tags', async () => {
      // Wait for recipe to load
      await waitFor(() => {
        expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
      })

      // 1. Click on tag manager button
      const tagManagerButton = screen.getByTitle(/Manage hashtags/)
      fireEvent.click(tagManagerButton)

      // Wait for dropdown to open
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Type hashtag name/)).toBeInTheDocument()
      })

      // 2. Verify existing tags are shown
      expect(screen.getByText('Dinner')).toBeInTheDocument()
      expect(screen.getByText('Lunch')).toBeInTheDocument()
    })

    it('creates a new tag and applies it to recipe', async () => {
      // Wait for recipe to load
      await waitFor(() => {
        expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
      })

      // 1. Click on tag manager button
      const tagManagerButton = screen.getByTitle(/Manage hashtags/)
      fireEvent.click(tagManagerButton)

      // Wait for dropdown to open
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Type hashtag name/)).toBeInTheDocument()
      })

      // 2. Type a new tag name
      const input = screen.getByPlaceholderText(/Type hashtag name/)
      await userEvent.type(input, 'new-tag')
      
      // Debug: Check if input has the value
      // expect(input).toHaveValue('new-tag')

      // Wait for create button to appear
      await waitFor(() => {
        expect(screen.getByTestId('create-tag-button')).toBeInTheDocument()
      })

      // 3. Click create button
      const createButton = screen.getByTestId('create-tag-button')
      fireEvent.click(createButton)

      // Debug: Check if the button is disabled after clicking
      // await waitFor(() => {
      //   expect(createButton).toBeDisabled()
      // }, { timeout: 1000 })

      // Debug: Log current DOM state
      // console.log('DOM after clicking create button:', document.body.innerHTML)

      // 4. Wait for tag to be created and applied
      await waitFor(() => {
        // Check that the tag appears under recipe title
        expect(screen.getByText('new-tag')).toBeInTheDocument()
      }, { timeout: 5000 })

      // 5. Verify checkmark appears in dropdown (tag should be marked as applied)
      await waitFor(() => {
        const tagManagerButton = screen.getByTitle(/Manage hashtags/)
        fireEvent.click(tagManagerButton)
      })

      await waitFor(() => {
        // Look for the applied tag with checkmark
        const appliedTag = screen.getByText('new-tag')
        expect(appliedTag).toBeInTheDocument()
        // The checkmark should be visible (FontAwesome check icon)
        expect(screen.getByRole('button', { name: /remove.*new-tag/i })).toBeInTheDocument()
      })
    })
  })

  describe.skip('Scenario 2: Apply existing tag to recipe', () => {
    beforeEach(() => {
      render(
        <ComponentTestWrapper initialEntries={['/recipe/saved_recipe_id']}>
          <Routes>
            <Route path="/recipe/:recipeId" element={<RecipeDetailPage />} />
          </Routes>
        </ComponentTestWrapper>
      )
    })

    it('applies existing tag to recipe', async () => {
      // Wait for recipe to load
      await waitFor(() => {
        expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
      })

      // 1. Click on tag manager button
      const tagManagerButton = screen.getByTitle(/Manage hashtags/)
      fireEvent.click(tagManagerButton)

      // Wait for dropdown to open
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Type hashtag name/)).toBeInTheDocument()
      })

      // 2. Look for existing tag (Dinner or Lunch from mock data)
      await waitFor(() => {
        const existingTag = screen.getByText('#Dinner')
        expect(existingTag).toBeInTheDocument()
      })

      // 3. Click on existing tag to apply it
      const existingTag = screen.getByText('Dinner')
      fireEvent.click(existingTag)

      // 4. Wait for tag to be applied
      await waitFor(() => {
        // Check that the tag appears under recipe title
        expect(screen.getByText('#Dinner')).toBeInTheDocument()
      })

      // 5. Verify checkmark appears in dropdown
      await waitFor(() => {
        const tagManagerButton = screen.getByTitle(/Manage hashtags/)
        fireEvent.click(tagManagerButton)
      })

      await waitFor(() => {
        // Look for the applied tag with checkmark
        const appliedTag = screen.getByText('Dinner')
        expect(appliedTag).toBeInTheDocument()
        // The checkmark should be visible (FontAwesome check icon)
        expect(screen.getByRole('button', { name: /remove.*Dinner/i })).toBeInTheDocument()
      })
    })
  })

  describe('Scenario 3: Remove applied tag from recipe', () => {
    beforeEach(() => {
      // Set up a recipe that already has a tag applied
      server.use(
        http.get(`${API_URL}/recipes/saved_recipe_id`, () => {
          return HttpResponse.json({
            success: true,
            data: {
              id: 'saved_recipe_id',
              title: 'Spaghetti Carbonara',
              summary: 'Classic Italian pasta dish',
              imageUrl: 'https://example.com/carbonara.jpg',
              prepTime: '10 mins',
              cookTime: '15 mins',
              servings: '4',
              ingredients: [
                'pasta',
                'eggs', 
                'bacon',
                'parmesan'
              ],
              instructions: [
                'Boil pasta',
                'Cook bacon',
                'Mix eggs and cheese',
                'Combine'
              ],
                userTags: [createMockUserTag({ id: 'tag1', name: 'Dinner' })],
              isSaved: true,
              savedAt: '2025-01-01T00:00:00Z'
            }
          })
        })
      )

      render(
        <ComponentTestWrapper initialEntries={['/recipe/saved_recipe_id']}>
          <Routes>
            <Route path="/recipe/:recipeId" element={<RecipeDetailPage />} />
          </Routes>
        </ComponentTestWrapper>
      )
    })

    it('removes applied tag from recipe', async () => {
      // Wait for recipe to load with applied tag
      await waitFor(() => {
        expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
        expect(screen.getByText('#Dinner')).toBeInTheDocument()
      })

      // 1. Click on tag manager button
      const tagManagerButton = screen.getByTitle(/Manage hashtags/)
      fireEvent.click(tagManagerButton)

      // Wait for dropdown to open
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Type hashtag name/)).toBeInTheDocument()
      })

      // 2. Find the applied tag with remove button
      await waitFor(() => {
        const removeButton = screen.getByTitle('Remove from recipe')
        expect(removeButton).toBeInTheDocument()
      })

      // 3. Click remove button
      const removeButton = screen.getByTitle('Remove from recipe')
      fireEvent.click(removeButton)

      // 4. Wait for tag to be removed from recipe
      await waitFor(() => {
        // Tag should no longer appear under recipe title
        expect(screen.queryByText('#Dinner')).not.toBeInTheDocument()
      })

      // 5. Verify tag no longer has checkmark in dropdown
      await waitFor(() => {
        const tagManagerButton = screen.getByTitle(/Manage hashtags/)
        fireEvent.click(tagManagerButton)
      })

      await waitFor(() => {
        // Tag should still exist but without checkmark
        const tag = screen.getByText('Dinner')
        expect(tag).toBeInTheDocument()
        // Should not have remove button (no checkmark)
        expect(screen.queryByRole('button', { name: /remove.*Dinner/i })).not.toBeInTheDocument()
      })
    })
  })

  describe('Tag Manager UI States', () => {
    beforeEach(() => {
      render(
        <ComponentTestWrapper initialEntries={['/recipe/saved_recipe_id']}>
          <Routes>
            <Route path="/recipe/:recipeId" element={<RecipeDetailPage />} />
          </Routes>
        </ComponentTestWrapper>
      )
    })

    it('shows correct button title based on applied tags', async () => {
      // Wait for recipe to load
      await waitFor(() => {
        expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
      })

      // Initially should show "Manage hashtags" since recipe has tags applied
      const tagManagerButton = screen.getByTitle(/Manage hashtags/)
      expect(tagManagerButton).toBeInTheDocument()

      // Click to open dropdown
      fireEvent.click(tagManagerButton)

      // Apply a tag
      await waitFor(() => {
        const existingTag = screen.getByText('Dinner')
        fireEvent.click(existingTag)
      })

      // Wait for tag to be applied
      await waitFor(() => {
        expect(screen.getByText('Dinner')).toBeInTheDocument()
      })

      // Button title should change to "Manage hashtags"
      await waitFor(() => {
        const updatedButton = screen.getByTitle(/Manage hashtags/)
        expect(updatedButton).toBeInTheDocument()
      })
    })

    it('closes dropdown when clicking outside', async () => {
      // Wait for recipe to load
      await waitFor(() => {
        expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
      })

      // Click to open dropdown
      const tagManagerButton = screen.getByTitle(/Manage hashtags/)
      fireEvent.click(tagManagerButton)

      // Wait for dropdown to open
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Type hashtag name/)).toBeInTheDocument()
      })

      // Click outside the dropdown
      fireEvent.click(document.body)

      // Wait for dropdown to close
      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/Search or create hashtag/)).not.toBeInTheDocument()
      })
    })

    it('filters tags based on search input', async () => {
      // Wait for recipe to load
      await waitFor(() => {
        expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
      })

      // Click to open dropdown
      const tagManagerButton = screen.getByTitle(/Manage hashtags/)
      fireEvent.click(tagManagerButton)

      // Wait for dropdown to open
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Type hashtag name/)).toBeInTheDocument()
      })

      // Type in search input
      const input = screen.getByPlaceholderText(/Type hashtag name/)
      fireEvent.change(input, { target: { value: 'din' } })

      // Should show filtered results
      await waitFor(() => {
        expect(screen.getByText('Dinner')).toBeInTheDocument()
        expect(screen.queryByText('Lunch')).not.toBeInTheDocument()
      })
    })
  })
})
