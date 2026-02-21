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

  // Pantry Events
  pantryPageViewed: 'pantryPageViewed',
  pantryPhotoUploaded: 'pantryPhotoUploaded',
  pantryTypeIngredientsClicked: 'pantryTypeIngredientsClicked',
  ingredientsParsed: 'ingredientsParsed',
  mealPlanGenerated: 'mealPlanGenerated',
  mealPlanAccepted: 'mealPlanAccepted',
  mealPlanSaved: 'mealPlanSaved',

  // Weekly Plan Wizard Events
  // Funnel: weeklyPlanStarted → weeklyPlanGenerated → weeklyPlanSaved
  weeklyPlanStarted: 'weeklyPlanStarted',           // user opens /plan preferences form
  weeklyPlanGenerated: 'weeklyPlanGenerated',       // plan generation completed; props: { numDinners, dietary, servings }
  weeklyPlanSaved: 'weeklyPlanSaved',               // plan saved after sign-up
  weeklyPlanMealSwapped: 'weeklyPlanMealSwapped',   // meal swap triggered; props: { day }
  weeklyPlanMealCooked: 'weeklyPlanMealCooked',     // meal marked as cooked; props: { day, mealsCooked, totalMeals }

  // Grocery List Events
  // Funnel: groceryListOpened → groceryItemChecked → groceryListCompleted
  groceryListOpened: 'groceryListOpened',           // user opens grocery list page
  groceryItemChecked: 'groceryItemChecked',         // item checked off; props: { checked, total }
  groceryItemAdded: 'groceryItemAdded',             // manual item added
  groceryListCompleted: 'groceryListCompleted',     // all items checked (100% progress)

  // Single Meal Events
  // Funnel: singleMealStarted → singleMealGenerated → singleMealViewRecipeClicked | singleMealShowAnotherClicked | singleMealShared | singleMealUpsellClicked
  singleMealStarted: 'singleMealStarted',           // generation triggered; props: { excludeCount }
  singleMealGenerated: 'singleMealGenerated',       // generation completed; props: { recipeId, title }
  singleMealShowAnotherClicked: 'singleMealShowAnotherClicked', // user regenerates

  // Gate Events
  signupGateShown: 'signupGateShown',               // sign-up prompt shown; props: { trigger: 'save_plan' | 'check_item' }
  signupGateConverted: 'signupGateConverted',       // user signed up from gate
  upgradeGateShown: 'upgradeGateShown',             // upgrade prompt shown; props: { trigger: 'second_plan' | 'plan_history' | 'swap_limit' }
  upgradeGateConverted: 'upgradeGateConverted',     // user upgraded from gate
} as const

// Type definitions for better type safety
export type PostHogEventName = typeof POSTHOG_EVENTS[keyof typeof POSTHOG_EVENTS]

