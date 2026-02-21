import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SingleMealResult } from '../../services/singleMealService';

interface SingleMealCardProps {
  result: SingleMealResult;
  servings?: number;
  isRegenerating?: boolean;
  onShowAnother: () => void;
}

const SingleMealCard: React.FC<SingleMealCardProps> = ({
  result,
  servings,
  isRegenerating,
  onShowAnother,
}) => {
  const navigate = useNavigate();
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');

  const { recipe, reasoning } = result;

  const shareUrl = `${window.location.origin}/${recipe.id}?ref=share`;

  const handleShare = async () => {
    const shareData = {
      title: recipe.title,
      text: `Tonight's dinner: ${recipe.title} — ${reasoning}`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled or share failed — fall through to copy
        await copyLink();
      }
    } else {
      await copyLink();
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareState('copied');
      setTimeout(() => setShareState('idle'), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <div className="max-w-sm mx-auto">
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        {/* Thumbnail */}
        <button
          onClick={() => navigate(`/${recipe.id}`)}
          className="block w-full relative"
          aria-label={`View ${recipe.title}`}
        >
          {recipe.thumbnail ? (
            <img
              src={recipe.thumbnail}
              alt={recipe.title}
              className="w-full h-52 object-cover"
            />
          ) : (
            <div className="w-full h-52 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
              <span className="text-6xl">🍽️</span>
            </div>
          )}
        </button>

        {/* Content */}
        <div className="p-5">
          <button
            onClick={() => navigate(`/${recipe.id}`)}
            className="text-left w-full mb-2"
          >
            <h2 className="text-xl font-bold text-gray-900 leading-snug">
              {recipe.title}
            </h2>
          </button>

          {/* Meta: cook time + servings */}
          <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {recipe.cookTime} min
            </span>
            {servings && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Serves {servings}
              </span>
            )}
          </div>

          {/* Reasoning quote */}
          <p className="text-gray-600 text-sm italic leading-relaxed mb-5">
            "{reasoning}"
          </p>

          {/* Primary actions */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => navigate(`/${recipe.id}`)}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm"
            >
              View Recipe
            </button>
            <button
              onClick={onShowAnother}
              disabled={isRegenerating}
              className="flex-1 border border-gray-200 hover:border-orange-300 hover:bg-orange-50 text-gray-700 font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              {isRegenerating ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Finding…
                </>
              ) : (
                'Show Another'
              )}
            </button>
          </div>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-orange-500 transition-colors py-1.5"
          >
            {shareState === 'copied' ? (
              <>
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-600">Link copied!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share this dinner idea
              </>
            )}
          </button>

          {/* Divider + upsell */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => navigate('/plan')}
              className="w-full text-center text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
            >
              Like this? Plan your whole week →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleMealCard;
