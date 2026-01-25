import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import ImageUpload from '../components/pantry/ImageUpload';
import IngredientChecklist from '../components/pantry/IngredientChecklist';
import MealPlanDisplay from '../components/pantry/MealPlanDisplay';
import MyPlans from '../components/pantry/MyPlans';
import ActivePlanView from '../components/pantry/ActivePlanView';
import { useJobProgress } from '../hooks/useJobProgress';
import {
  parseIngredients,
  generateMealPlan,
  uploadPantryImages,
  saveMealPlan,
  getMealPlans,
  updateMealPlanStatus,
  deleteMealPlan,
  type ParsedIngredient,
  type MealPlan,
  type SavedMealPlan,
} from '../services/pantryService';

type Tab = 'new' | 'my-plans';
type FlowState = 'upload' | 'parsing' | 'checklist' | 'generating' | 'review' | 'view-plan';

const PantryPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>('new');

  // New plan flow state
  const [flowState, setFlowState] = useState<FlowState>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [parseJobId, setParseJobId] = useState<string | null>(null);
  const [mealPlanJobId, setMealPlanJobId] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<ParsedIngredient[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  // My plans state
  const [savedPlans, setSavedPlans] = useState<SavedMealPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SavedMealPlan | null>(null);

  // WebSocket progress for parsing
  const { progress: parseProgress } = useJobProgress(parseJobId, {
    onComplete: (result) => {
      const parsed = result as ParsedIngredient[];
      setIngredients(parsed);
      setFlowState('checklist');
      setParseJobId(null);
    },
    onError: (err) => {
      setError(err);
      setFlowState('upload');
      setParseJobId(null);
    },
  });

  // WebSocket progress for meal plan
  const { progress: mealPlanProgress } = useJobProgress(mealPlanJobId, {
    onComplete: (result) => {
      setMealPlan(result as MealPlan);
      setFlowState('review');
      setMealPlanJobId(null);
    },
    onError: (err) => {
      setError(err);
      setFlowState('checklist');
      setMealPlanJobId(null);
    },
  });

  // Load saved plans when switching to my-plans tab
  useEffect(() => {
    if (activeTab === 'my-plans' && user) {
      loadSavedPlans();
    }
  }, [activeTab, user]);

  const loadSavedPlans = async () => {
    if (!user) return;
    setIsLoadingPlans(true);
    try {
      const result = await getMealPlans(user.id);
      if (result.success && result.data) {
        setSavedPlans(result.data);
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const handleImageUpload = useCallback(
    async (files: File[]) => {
      if (!user) {
        navigate('/login');
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        // Upload all images to Supabase storage
        const uploadResult = await uploadPantryImages(files, user.id, supabase);

        if ('error' in uploadResult) {
          throw new Error(uploadResult.error);
        }

        // Start parsing job with all image URLs
        const jobResult = await parseIngredients(uploadResult.urls, user.id);

        if (!jobResult.success || !jobResult.data) {
          throw new Error(jobResult.error || 'Failed to start parsing');
        }

        setParseJobId(jobResult.data.jobId);
        setFlowState('parsing');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload images');
      } finally {
        setIsUploading(false);
      }
    },
    [user, navigate]
  );

  const handleGenerateMealPlan = useCallback(
    async (selected: string[], additionalInstructions?: string) => {
      if (!user) {
        navigate('/login');
        return;
      }

      setSelectedIngredients(selected);
      setError(null);

      try {
        const jobResult = await generateMealPlan(user.id, selected, {
          additionalInstructions,
        });

        if (!jobResult.success || !jobResult.data) {
          throw new Error(jobResult.error || 'Failed to start meal plan generation');
        }

        setMealPlanJobId(jobResult.data.jobId);
        setFlowState('generating');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate meal plan');
      }
    },
    [user, navigate]
  );

  const handleAcceptPlan = useCallback(async () => {
    if (!user || !mealPlan) return;

    setIsAccepting(true);
    setError(null);

    try {
      const result = await saveMealPlan(user.id, selectedIngredients, mealPlan);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to save meal plan');
      }

      // Switch to my plans tab and show the new plan
      setSavedPlans((prev) => [result.data!, ...prev]);
      setSelectedPlan(result.data);
      setActiveTab('my-plans');
      setFlowState('view-plan');

      // Reset new plan state
      setIngredients([]);
      setSelectedIngredients([]);
      setMealPlan(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save meal plan');
    } finally {
      setIsAccepting(false);
    }
  }, [user, mealPlan, selectedIngredients]);

  const handleRegenerate = useCallback(() => {
    // Go back to checklist to generate again
    setFlowState('checklist');
    setMealPlan(null);
  }, []);

  const handleStartOver = useCallback(() => {
    setFlowState('upload');
    setIngredients([]);
    setSelectedIngredients([]);
    setMealPlan(null);
    setError(null);
    setParseJobId(null);
    setMealPlanJobId(null);
  }, []);

  const handleSelectPlan = useCallback((plan: SavedMealPlan) => {
    setSelectedPlan(plan);
    setFlowState('view-plan');
  }, []);

  const handleUpdatePlanStatus = useCallback(
    async (planId: string, status: 'active' | 'completed') => {
      if (!user) return;

      try {
        const result = await updateMealPlanStatus(planId, user.id, status);
        if (result.success && result.data) {
          setSavedPlans((prev) =>
            prev.map((p) => (p.id === planId ? result.data! : p))
          );
          if (selectedPlan?.id === planId) {
            setSelectedPlan(result.data);
          }
        }
      } catch (err) {
        console.error('Failed to update plan status:', err);
      }
    },
    [user, selectedPlan]
  );

  const handleDeletePlan = useCallback(
    async (planId: string) => {
      if (!user) return;

      try {
        const result = await deleteMealPlan(planId, user.id);
        if (result.success) {
          setSavedPlans((prev) => prev.filter((p) => p.id !== planId));
          if (selectedPlan?.id === planId) {
            setSelectedPlan(null);
            setFlowState('upload');
          }
        }
      } catch (err) {
        console.error('Failed to delete plan:', err);
      }
    },
    [user, selectedPlan]
  );

  const handleCreateNew = useCallback(() => {
    setActiveTab('new');
    setSelectedPlan(null);
    handleStartOver();
  }, [handleStartOver]);

  const handleBackToMyPlans = useCallback(() => {
    setSelectedPlan(null);
    setFlowState('upload');
    loadSavedPlans();
  }, []);

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign in to use Pantry Planner</h2>
        <p className="text-gray-600 mb-8">
          Create an account to upload photos and get personalized meal plans
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
        >
          Sign In
        </button>
      </div>
    );
  }

  // Show selected plan view
  if (activeTab === 'my-plans' && selectedPlan && flowState === 'view-plan') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <ActivePlanView
          plan={selectedPlan}
          onBack={handleBackToMyPlans}
          onComplete={() => handleUpdatePlanStatus(selectedPlan.id, 'completed')}
          onDelete={() => handleDeletePlan(selectedPlan.id)}
          onCreateNew={handleCreateNew}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Pantry Planner</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Upload photos of your ingredients and get a personalized 3-meal plan
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => {
              setActiveTab('new');
              setSelectedPlan(null);
            }}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'new'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            New Plan
          </button>
          <button
            onClick={() => {
              setActiveTab('my-plans');
              setSelectedPlan(null);
            }}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'my-plans'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Plans
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && activeTab === 'new' && (
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="font-medium text-red-800">Something went wrong</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* My Plans Tab */}
      {activeTab === 'my-plans' && (
        <MyPlans
          plans={savedPlans}
          isLoading={isLoadingPlans}
          onSelectPlan={handleSelectPlan}
          onDeletePlan={handleDeletePlan}
          onUpdateStatus={handleUpdatePlanStatus}
          onCreateNew={handleCreateNew}
        />
      )}

      {/* New Plan Tab */}
      {activeTab === 'new' && (
        <>
          {/* Progress Steps */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="flex items-center justify-between">
              {['Upload Photos', 'Review Ingredients', 'Get Meal Plan'].map((step, index) => {
                const stepNum = index + 1;
                const isActive =
                  (stepNum === 1 && ['upload', 'parsing'].includes(flowState)) ||
                  (stepNum === 2 && ['checklist', 'generating'].includes(flowState)) ||
                  (stepNum === 3 && flowState === 'review');
                const isComplete =
                  (stepNum === 1 && !['upload', 'parsing'].includes(flowState)) ||
                  (stepNum === 2 && flowState === 'review');

                return (
                  <React.Fragment key={step}>
                    <div className="flex items-center">
                      <div
                        className={`
                          w-10 h-10 rounded-full flex items-center justify-center font-semibold
                          ${
                            isComplete
                              ? 'bg-green-500 text-white'
                              : isActive
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-500'
                          }
                        `}
                      >
                        {isComplete ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          stepNum
                        )}
                      </div>
                      <span
                        className={`ml-3 font-medium hidden sm:block ${
                          isActive ? 'text-gray-900' : 'text-gray-500'
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                    {index < 2 && (
                      <div
                        className={`flex-1 h-1 mx-4 rounded ${
                          isComplete ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Flow States */}
          {flowState === 'upload' && <ImageUpload onUpload={handleImageUpload} isUploading={isUploading} />}

          {flowState === 'parsing' && (
            <div className="max-w-2xl mx-auto text-center py-16">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <svg
                  className="w-10 h-10 text-white animate-pulse"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Analyzing Your Ingredients</h2>
              <p className="text-gray-600 mb-6">
                {parseProgress?.message || 'Our AI is identifying ingredients in your photos...'}
              </p>
              <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${parseProgress?.progress || 10}%` }}
                />
              </div>
            </div>
          )}

          {flowState === 'checklist' && ingredients.length > 0 && (
            <IngredientChecklist
              ingredients={ingredients}
              onSubmit={handleGenerateMealPlan}
              isSubmitting={false}
            />
          )}

          {flowState === 'generating' && (
            <div className="max-w-2xl mx-auto text-center py-16">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-white animate-spin" fill="none" viewBox="0 0 24 24">
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Creating Your Meal Plan</h2>
              <p className="text-gray-600 mb-6">
                {mealPlanProgress?.message || 'Finding the best recipes for your ingredients...'}
              </p>
              <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${mealPlanProgress?.progress || 10}%` }}
                />
              </div>
            </div>
          )}

          {flowState === 'review' && mealPlan && (
            <MealPlanDisplay
              mealPlan={mealPlan}
              mode="review"
              onAccept={handleAcceptPlan}
              onRegenerate={handleRegenerate}
              isAccepting={isAccepting}
            />
          )}
        </>
      )}
    </div>
  );
};

export default PantryPage;
