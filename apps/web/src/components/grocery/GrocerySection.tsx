import React, { useState } from 'react';
import GroceryItem, { type GroceryItemData } from './GroceryItem';

const CATEGORY_EMOJIS: Record<string, string> = {
  produce: '🥦',
  meat_seafood: '🥩',
  dairy: '🧀',
  pantry: '🫙',
  frozen: '🧊',
  bakery: '🍞',
  other: '🛒',
};

interface GrocerySectionProps {
  category: string;
  label: string;
  items: GroceryItemData[];
  onToggle: (itemId: string, checked: boolean) => void;
}

const GrocerySection: React.FC<GrocerySectionProps> = ({ category, label, items, onToggle }) => {
  const [collapsed, setCollapsed] = useState(false);
  const checkedCount = items.filter((i) => i.checked).length;
  const emoji = CATEGORY_EMOJIS[category] ?? '🛒';
  const allDone = checkedCount === items.length;

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <span className={`font-semibold text-sm ${allDone ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
            {label}
          </span>
          <span className="text-xs text-gray-400">
            ({checkedCount}/{items.length})
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${collapsed ? '-rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!collapsed && (
        <div>
          {items.map((item) => (
            <GroceryItem key={item.id} item={item} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  );
};

export default GrocerySection;
