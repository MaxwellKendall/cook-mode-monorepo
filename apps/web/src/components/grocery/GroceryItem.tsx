import React from 'react';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export interface GroceryItemData {
  id: string;
  name: string;
  quantity?: string | null;
  checked: boolean;
  isManualAdd: boolean;
  recipeAttributions: Array<{ recipeId: string; title: string; day: number }>;
}

interface GroceryItemProps {
  item: GroceryItemData;
  onToggle: (itemId: string, checked: boolean) => void;
}

const GroceryItem: React.FC<GroceryItemProps> = ({ item, onToggle }) => {
  const days = item.recipeAttributions
    .map((a) => DAY_NAMES[(a.day - 1) % 7])
    .filter(Boolean)
    .join(', ');

  return (
    <button
      type="button"
      onClick={() => onToggle(item.id, !item.checked)}
      className="w-full flex items-center gap-4 px-4 py-3.5 min-h-[52px] text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
    >
      {/* Checkbox */}
      <div
        className={`w-6 h-6 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
          item.checked ? 'border-green-500 bg-green-500' : 'border-gray-300'
        }`}
      >
        {item.checked && (
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span
            className={`text-base font-medium transition-colors ${
              item.checked ? 'line-through text-gray-400' : 'text-gray-900'
            }`}
          >
            {item.name}
          </span>
          {item.quantity && (
            <span className={`text-sm flex-shrink-0 ${item.checked ? 'text-gray-300' : 'text-gray-400'}`}>
              {item.quantity}
            </span>
          )}
        </div>
        {days && !item.isManualAdd && (
          <p className={`text-xs mt-0.5 ${item.checked ? 'text-gray-300' : 'text-gray-400'}`}>
            {days}
          </p>
        )}
      </div>
    </button>
  );
};

export default GroceryItem;
