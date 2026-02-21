import React, { useState, useEffect, useRef } from 'react';
import { usePostHog } from '@posthog/react';
import { useAuth } from '../contexts/AuthContext';
import { useGenerateSingleMeal } from '../hooks/mutations';
import { useJobProgress } from '../hooks/useJobProgress';
import SingleMealCard from '../components/meal/SingleMealCard';
import type { SingleMealResult } from '../services/singleMealService';
import { POSTHOG_EVENTS } from '../lib/posthogEvents';

function getAnonymousSessionId(): string {
  const key = 'cook-mode-anon-session';
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
}

const LOADING_MESSAGES = [
  'Finding the perfect recipe for tonight…',
  'Checking what works for you…',
  'Almost there…',
];

type PageStep = 'generating' | 'result' | 'error';

const SingleMealPage: React.FC = () => {
  const { user } = useAuth();
  const posthog = usePostHog();
  const generateMeal = useGenerateSingleMeal();

  const [step, setStep] = useState<PageStep>('generating');
  const [jobId, setJobId] = useState<string | null>(null);
  const [result, setResult] = useState<SingleMealResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [excludeIds, setExcludeIds] = useState<string[]>([]);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [servings] = useState(2);
  const hasFiredRef = useRef(false);

  const anonymousSessionId = user ? undefined : getAnonymousSessionId();

  const startGeneration = async (exclude: string[] = []) => {
    setStep('generating');
    setJobId(null);
    setResult(null);
    setError(null);
    setLoadingMsgIdx(0);

    posthog?.capture(POSTHOG_EVENTS.singleMealStarted, { excludeCount: exclude.length });

    try {
      const data = await generateMeal.mutateAsync({
        preferences: { servings, excludeRecipeIds: exclude },
        userId: user?.id,
        anonymousSessionId,
      });
      setJobId(data.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start generation');
      setStep('error');
    }
  };

  // Auto-start on mount
  useEffect(() => {
    if (hasFiredRef.current) return;
    hasFiredRef.current = true;
    startGeneration([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cycle loading messages
  useEffect(() => {
    if (step !== 'generating') return;
    const interval = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [step]);

  // WebSocket job progress
  const { isComplete } = useJobProgress(jobId, {
    onComplete: (rawResult) => {
      const mealResult = rawResult as SingleMealResult;
      setResult(mealResult);
      setStep('result');
      posthog?.capture(POSTHOG_EVENTS.singleMealGenerated, {
        recipeId: mealResult.recipe?.id,
        title: mealResult.recipe?.title,
      });
    },
    onError: (err) => {
      setError(err);
      setStep('error');
    },
  });

  const handleShowAnother = () => {
    const newExclude = result ? [...excludeIds, result.recipe.id] : excludeIds;
    setExcludeIds(newExclude);
    posthog?.capture(POSTHOG_EVENTS.singleMealShowAnotherClicked);
    startGeneration(newExclude);
  };

  if (step === 'error') {
    return (
      <div className="max-w-sm mx-auto text-center py-16 px-4">
        <div className="w-20 h-20 mx-auto bg-red-100 rounded-2xl flex items-center justify-center mb-6 text-4xl">
          ⚠️
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Something went wrong</h2>
        <p className="text-gray-500 mb-8">{error || 'Could not find a meal right now.'}</p>
        <button
          onClick={() => startGeneration(excludeIds)}
          className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (step === 'generating') {
    return (
      <div className="max-w-sm mx-auto text-center py-16 px-4">
        {/* Animated icon */}
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl flex items-center justify-center mb-8 shadow-lg">
          <span className="text-5xl animate-bounce">🍽️</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Just Tonight</h2>
        <p
          key={loadingMsgIdx}
          className="text-gray-500 text-sm h-5 transition-all duration-300"
        >
          {LOADING_MESSAGES[loadingMsgIdx]}
        </p>
        {/* Indeterminate progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-2 mt-8 overflow-hidden">
          <div className="h-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 animate-progress-indeterminate" />
        </div>
      </div>
    );
  }

  if (step === 'result' && result) {
    return (
      <div className="py-8 px-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Tonight's Dinner</h1>
          <p className="text-gray-500 text-sm mt-1">AI-picked just for you</p>
        </div>
        <SingleMealCard
          result={result}
          servings={servings}
          isRegenerating={!isComplete && step === 'generating'}
          onShowAnother={handleShowAnother}
        />
      </div>
    );
  }

  return null;
};

export default SingleMealPage;
