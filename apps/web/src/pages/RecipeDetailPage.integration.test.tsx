import * as React from 'react'
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { handlers } from '../test/mocks/handlers'
import { ComponentTestWrapper, mockAuthContext, mockSubscriptionContext } from '../test/utils/component-test-wrapper'
import RecipeDetailPage from './RecipeDetailPage'

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

describe('RecipeDetailPage Integration Tests', () => {
  describe('not saved recipes display correct UI', () => {
    beforeEach(() => {
      render(
        <ComponentTestWrapper initialEntries={['/recipe/unsaved_recipe_id']}>
          <Routes>
            <Route path="/recipe/:recipeId" element={<RecipeDetailPage />} />
          </Routes>
        </ComponentTestWrapper>
      )
    })

    it('displays recipe title and description', async () => {
      await waitFor(() => {
        expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
      })
      
      expect(screen.getByText(/Classic Italian pasta dish/)).toBeInTheDocument()
    })

    it('displays recipe ingredients', async () => {
      await waitFor(() => {
        expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
      })
      
      expect(screen.getByText('pasta')).toBeInTheDocument()
      expect(screen.getByText('eggs')).toBeInTheDocument()
      expect(screen.getByText('bacon')).toBeInTheDocument()
      expect(screen.getByText('parmesan')).toBeInTheDocument()
    })

    it('displays recipe instructions', async () => {
      await waitFor(() => {
        expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
      })
      
      expect(screen.getByText('Boil pasta')).toBeInTheDocument()
      expect(screen.getByText('Cook bacon')).toBeInTheDocument()
      expect(screen.getByText('Mix eggs and cheese')).toBeInTheDocument()
      expect(screen.getByText('Combine')).toBeInTheDocument()
    })

    it('displays cooking assistant controls', async () => {
      await waitFor(() => {
        expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
      })
      
      // Look for cooking assistant toggle button
      expect(screen.getByLabelText(/Toggle cook mode/i)).toBeInTheDocument()
    })
    it('displays save button for authenticated users', async () => {
      await waitFor(() => {
        expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
      })
      
      // Wait for the recipe to load with user data (saved state)
      await waitFor(() => {
        const saveButton = screen.getByTitle(/Save recipe/)
        expect(saveButton).toBeInTheDocument()  
      })
    })
  })
  describe('saved recipes display correct UI', () => {
    beforeEach(() => {
      render(
        <ComponentTestWrapper initialEntries={['/recipe/saved_recipe_id']}>
          <Routes>
            <Route path="/recipe/:recipeId" element={<RecipeDetailPage />} />
          </Routes>
        </ComponentTestWrapper>
      )
    })

    it('displays unsave button for authenticated users', async () => {
      await waitFor(() => {
        expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
      })
      
      // Wait for the recipe to load with user data (saved state)
      await waitFor(() => {
        const saveButton = screen.getByTitle(/Remove from saved recipes/)
        expect(saveButton).toBeInTheDocument()
      })
    })
    it('displays the tag manager', async () => {
      await waitFor(() => {
        expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
        })
      
      // Wait for the recipe to load with user data (saved state)
      await waitFor(() => {
        const tagManager = screen.getByTitle(/Manage hashtags/)
        expect(tagManager).toBeInTheDocument()
      })
    })
  })
  describe('error handling', () => {
    it('displays error message when recipe fetch fails', async () => {
      // Override the default handler to return an error
      server.use(
        http.get(`${API_URL}/recipes/recipe1`, () => {
          return HttpResponse.error()
        })
      )

      render(
        <ComponentTestWrapper initialEntries={['/recipe/recipe1']}>
          <Routes>
            <Route path="/recipe/:recipeId" element={<RecipeDetailPage />} />
          </Routes>
        </ComponentTestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument()
      })
    })

    it('displays not found message for non-existent recipe', async () => {
      // Override the default handler to return 404
      server.use(
        http.get(`${API_URL}/recipes/nonexistent`, () => {
          return new HttpResponse(null, { status: 404 })
        })
      )

      render(
        <ComponentTestWrapper initialEntries={['/recipe/nonexistent']}>
          <Routes>
            <Route path="/recipe/:recipeId" element={<RecipeDetailPage />} />
          </Routes>
        </ComponentTestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/Recipe not found/i)).toBeInTheDocument()
      })
    })
  })
})
