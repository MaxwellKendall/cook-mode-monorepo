import React, { useState } from 'react';
import PreferencesForm from '../components/plan/PreferencesForm';
import { generateWeeklyPlan, type WeeklyPlanPreferences } from '../services/weeklyPlanService';
import { useAuth } from '../contexts/AuthContext';

type WizardStep = 'preferences' | 'generating' | 'review';

// Generate or retrieve a persistent anonymous session ID
function getAnonymousSessionId(): string {
  const key = 'cook-mode-anon-session';
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
}

const STEPS = ['Your Preferences', 'Generating Plan', 'Review & Save'];

function StepIndicator({ currentStep }: { currentStep: WizardStep }) {
  const stepIndex = ['preferences', 'generating', 'review'].indexOf(currentStep);
  return (
    <div className="flex items-center justify-between max-w-sm mx-auto mb-10">
      {STEPS.map((label, i) => {
        const isComplete = i < stepIndex;
        const isActive = i === stepIndex;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  isComplete
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isComplete ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 rounded ${isComplete ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

const PlanWizardPage: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<WizardStep>('preferences');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<WeeklyPlanPreferences | null>(null);

  const anonymousSessionId = user ? undefined : getAnonymousSessionId();

  const handlePreferencesSubmit = async (prefs: WeeklyPlanPreferences) => {
    setIsSubmitting(true);
    setError(null);
    setPreferences(prefs);

    try {
      const result = await generateWeeklyPlan(prefs, {
        userId: user?.id,
        anonymousSessionId,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to start plan generation');
      }

      setJobId(result.data.jobId);
      setStep('generating');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Weekly Dinner Plan</h1>
        <p className="text-gray-500">Personalized dinners for your week, done in seconds.</p>
      </div>

      <StepIndicator currentStep={step} />

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Step A: Preferences */}
      {step === 'preferences' && (
        <PreferencesForm onSubmit={handlePreferencesSubmit} isSubmitting={isSubmitting} />
      )}

      {/* Step B: Generating (CUS-62) */}
      {step === 'generating' && jobId && (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Building Your Plan</h2>
          <p className="text-gray-500">Searching recipes and putting together your week…</p>
          <p className="text-xs text-gray-400 mt-3">Job ID: {jobId}</p>
        </div>
      )}

      {/* Step C: Review (CUS-63) */}
      {step === 'review' && (
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Your Plan is Ready</h2>
          <p className="text-gray-500">Plan review coming in CUS-63.</p>
        </div>
      )}
    </div>
  );
};

export default PlanWizardPage;
