/**
 * PostHog Event Definitions
 * 
 * All event names are in camelCase for consistency.
 * Import the event names and use them with posthog?.capture()
 * Property keys should also be in camelCase (use them directly as strings).
 */

// Event Names
export const POSTHOG_EVENTS = {
  // Authentication Events
  userLoggedIn: 'userLoggedIn',
  userSignedUp: 'userSignedUp',
  
  // Recipe Events
  recipeSearched: 'recipeSearched',
  recipeImported: 'recipeImported',
  recipeTagged: 'recipeTagged',
  
  // Page View Events
  tagsPageViewed: 'tagsPageViewed',
  landingPageViewed: 'landingPageViewed',
  
  // Landing Page Interaction Events
  landingPageCtaClicked: 'landingPageCtaClicked',
  landingPageValuePropClicked: 'landingPageValuePropClicked',
  landingPageFaqOpened: 'landingPageFaqOpened',
} as const

// Type definitions for better type safety
export type PostHogEventName = typeof POSTHOG_EVENTS[keyof typeof POSTHOG_EVENTS]

