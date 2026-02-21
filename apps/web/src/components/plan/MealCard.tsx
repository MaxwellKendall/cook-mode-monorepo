import React from 'react';
import { useNavigate } from 'react-router-dom';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface MealCardProps {
  day: number;
  recipeId: string;
  title: string;
  imageUrl?: string;
  cookTime?: number;
  isSwapping?: boolean;
  onSwap: (day: number) => void;
}

const MealCard: React.FC<MealCardProps> = ({
  day,
  recipeId,
  title,
  imageUrl,
  cookTime,
  isSwapping,
  onSwap,
}) => {
  const navigate = useNavigate();
  const dayLabel = DAY_NAMES[(day - 1) % 7] ?? `Day ${day}`;

  return (
    <div className="flex-shrink-0 w-48 sm:w-52 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Thumbnail */}
      <button
        onClick={() => navigate(`/${recipeId}`)}
        className="block w-full relative"
        aria-label={`View ${title}`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-28 object-cover"
          />
        ) : (
          <div className="w-full h-28 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
            <span className="text-3xl">🍽️</span>
          </div>
        )}
        <div className="absolute top-2 left-2 bg-white/90 rounded-full px-2 py-0.5 text-xs font-semibold text-gray-700">
          {dayLabel}
        </div>
      </button>

      {/* Content */}
      <div className="p-3">
        <button
          onClick={() => navigate(`/${recipeId}`)}
          className="text-left w-full"
        >
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">
            {title}
          </h3>
        </button>

        <div className="flex items-center justify-between mt-2">
          {cookTime ? (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {cookTime}m
            </span>
          ) : (
            <span />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSwap(day);
            }}
            disabled={isSwapping}
            className="text-xs text-orange-500 hover:text-orange-700 font-medium disabled:opacity-40 flex items-center gap-1"
          >
            {isSwapping ? (
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Swap
          </button>
        </div>
      </div>
    </div>
  );
};

export default MealCard;
