import React, { useState, useEffect } from 'react';
import WeekView, { type WeekMeal } from './WeekView';
import GroceryListPreview, { type GroceryItemData } from './GroceryListPreview';
import LoginPrompt from '../auth/LoginPrompt';
import { useAuth } from '../../contexts/AuthContext';
import { saveWeeklyPlan, swapMeal } from '../../services/weeklyPlanService';

export interface PlanResult {
  weeklyPlanId: string;
  groceryListId?: string;
  meals: WeekMeal[];
  groceryItems: GroceryItemData[];
}

interface PlanReviewProps {
  result: PlanResult;
  anonymousSessionId?: string;
  onStartOver: () => void;
}

const PlanReview: React.FC<PlanReviewProps> = ({ result, anonymousSessionId, onStartOver }) => {
  const { user } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');
  const [meals, setMeals] = useState<WeekMeal[]>(result.meals);
  const [swappingDay, setSwappingDay] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [swapError, setSwapError] = useState<string | null>(null);

  // Auto-save for authenticated users after sign-up gate
  useEffect(() => {
    if (user && anonymousSessionId && !saved) {
      handleAutoSave(user.id);
    }
  }, [user]);

  const handleAutoSave = async (userId: string) => {
    if (!anonymousSessionId || saved) return;
    setIsSaving(true);
    try {
      await saveWeeklyPlan(userId, anonymousSessionId);
      setSaved(true);
    } catch {
      // non-critical — plan still viewable
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClick = () => {
    if (!user) {
      setLoginMessage('Sign in to save your plan and check off items while you shop');
      setShowLoginPrompt(true);
    }
  };

  const handleGroceryCheckbox = () => {
    if (!user) {
      setLoginMessage('Sign in to check off grocery items while you shop');
      setShowLoginPrompt(true);
    }
  };

  const handleSwap = async (day: number) => {
    if (!result.weeklyPlanId) return;
    setSwappingDay(day);
    setSwapError(null);
    try {
      await swapMeal(result.weeklyPlanId, day);
      // Swap is async — the new meal will arrive via WebSocket on the plan.
      // For now we just clear the loading state; a full implementation would
      // subscribe to the swap job and update the meals array when complete.
    } catch {
      setSwapError('Failed to swap meal. Please try again.');
    } finally {
      setSwappingDay(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Your Plan is Ready!</h2>
          <p className="text-sm text-gray-400 mt-0.5">Tap any meal to see the full recipe</p>
        </div>
        {isSaving && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Saving…
          </span>
        )}
        {saved && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Saved
          </span>
        )}
      </div>

      {swapError && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{swapError}</p>
      )}

      {/* Week view */}
      <WeekView meals={meals} swappingDay={swappingDay} onSwap={handleSwap} planId={result.weeklyPlanId} />

      {/* Grocery list */}
      {result.groceryItems.length > 0 && (
        <div className="border-t border-gray-100 pt-6">
          <GroceryListPreview
            items={result.groceryItems}
            isAuthenticated={!!user}
            onCheckboxClick={handleGroceryCheckbox}
          />
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        {!user && (
          <button
            onClick={handleSaveClick}
            className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-2xl transition-colors shadow-sm"
          >
            Save Plan & Grocery List
          </button>
        )}
        <button
          onClick={onStartOver}
          className={`py-4 font-semibold rounded-2xl transition-colors border border-gray-200 text-gray-600 hover:bg-gray-50 ${user ? 'flex-1' : 'px-6'}`}
        >
          Start Over
        </button>
      </div>

      {showLoginPrompt && (
        <LoginPrompt
          message={loginMessage}
          onClose={() => setShowLoginPrompt(false)}
          onAuthenticated={() => setShowLoginPrompt(false)}
        />
      )}
    </div>
  );
};

export default PlanReview;
