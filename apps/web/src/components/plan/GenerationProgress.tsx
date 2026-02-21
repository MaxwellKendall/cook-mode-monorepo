import React from 'react';
import { useJobProgress } from '../../hooks/useJobProgress';

interface GenerationProgressProps {
  jobId: string;
  onComplete: (result: unknown) => void;
  onError: (error: string) => void;
  onRetry: () => void;
}

const STAGE_LABELS: Record<string, string> = {
  finding_recipes: 'Finding recipes…',
  building_plan: 'Building your plan…',
  creating_grocery_list: 'Creating grocery list…',
  completed: 'Done!',
  failed: 'Something went wrong',
};

const STAGE_ICONS = [
  { stage: 'finding_recipes', label: 'Finding recipes', emoji: '🔍' },
  { stage: 'building_plan', label: 'Building plan', emoji: '📅' },
  { stage: 'creating_grocery_list', label: 'Creating grocery list', emoji: '🛒' },
];

const STAGE_ORDER = ['finding_recipes', 'building_plan', 'creating_grocery_list'];

const GenerationProgress: React.FC<GenerationProgressProps> = ({
  jobId,
  onComplete,
  onError,
  onRetry,
}) => {
  const { progress, isComplete } = useJobProgress(jobId, {
    onComplete,
    onError,
  });

  const isFailed = progress?.stage === 'failed';
  const currentStageIndex = STAGE_ORDER.indexOf(progress?.stage ?? '');
  const progressPct = progress?.progress ?? 5;
  const stageLabel =
    progress?.message ||
    STAGE_LABELS[progress?.stage ?? ''] ||
    'Getting started…';

  if (isFailed) {
    return (
      <div className="max-w-sm mx-auto text-center py-16">
        <div className="w-20 h-20 mx-auto bg-red-100 rounded-2xl flex items-center justify-center mb-6 text-4xl">
          ⚠️
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Generation Failed</h2>
        <p className="text-gray-500 mb-8">
          {progress?.error || 'Something went wrong. Please try again.'}
        </p>
        <button
          onClick={onRetry}
          className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto text-center py-10">
      {/* Animated icon */}
      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl flex items-center justify-center mb-8 shadow-lg">
        <svg
          className="w-12 h-12 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">Building Your Plan</h2>
      <p className="text-gray-500 text-sm mb-8 h-5 transition-all duration-300">{stageLabel}</p>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-2.5 mb-8 overflow-hidden">
        <div
          className="bg-gradient-to-r from-orange-400 to-orange-600 h-2.5 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${Math.max(progressPct, 5)}%` }}
        />
      </div>

      {/* Stage checklist */}
      <div className="space-y-3 text-left">
        {STAGE_ICONS.map(({ stage, label, emoji }, i) => {
          const isDone = currentStageIndex > i || isComplete;
          const isActive = currentStageIndex === i;
          return (
            <div key={stage} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 transition-colors ${
                  isDone
                    ? 'bg-green-100 text-green-600'
                    : isActive
                    ? 'bg-orange-100 text-orange-600'
                    : 'bg-gray-100 text-gray-300'
                }`}
              >
                {isDone ? '✓' : emoji}
              </div>
              <span
                className={`text-sm font-medium transition-colors ${
                  isDone ? 'text-green-700' : isActive ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GenerationProgress;
