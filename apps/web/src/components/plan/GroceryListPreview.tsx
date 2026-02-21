import React from 'react';

export interface GroceryItemData {
  name: string;
  quantity: string;
  category: string;
  recipeAttributions: Array<{ recipeId: string; title: string; day: number }>;
}

interface GroceryListPreviewProps {
  items: GroceryItemData[];
  isAuthenticated: boolean;
  onCheckboxClick: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  produce: 'Produce',
  meat_seafood: 'Meat & Seafood',
  dairy: 'Dairy',
  pantry: 'Pantry',
  frozen: 'Frozen',
  bakery: 'Bakery',
  other: 'Other',
};

const CATEGORY_ORDER = ['produce', 'meat_seafood', 'dairy', 'pantry', 'frozen', 'bakery', 'other'];

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function groupByCategory(items: GroceryItemData[]) {
  const grouped: Record<string, GroceryItemData[]> = {};
  for (const item of items) {
    const cat = item.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat]!.push(item);
  }
  return CATEGORY_ORDER
    .filter((cat) => grouped[cat]?.length)
    .map((cat) => ({ category: cat, label: CATEGORY_LABELS[cat] ?? cat, items: grouped[cat]! }));
}

const GroceryListPreview: React.FC<GroceryListPreviewProps> = ({
  items,
  isAuthenticated,
  onCheckboxClick,
}) => {
  const sections = groupByCategory(items);
  const totalCount = items.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Grocery List{' '}
          <span className="text-sm font-normal text-gray-400">({totalCount} items)</span>
        </h2>
      </div>

      <div className="space-y-5">
        {sections.map(({ category, label, items: sectionItems }) => (
          <div key={category}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              {label}
            </h3>
            <div className="space-y-2">
              {sectionItems.map((item, idx) => (
                <div
                  key={`${category}-${idx}`}
                  className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0"
                >
                  <button
                    type="button"
                    onClick={isAuthenticated ? undefined : onCheckboxClick}
                    className="mt-0.5 w-5 h-5 flex-shrink-0 rounded border-2 border-gray-300 hover:border-orange-400 transition-colors focus:outline-none"
                    aria-label={`Check off ${item.name}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-medium text-gray-800">{item.name}</span>
                      {item.quantity && (
                        <span className="text-xs text-gray-400 flex-shrink-0">{item.quantity}</span>
                      )}
                    </div>
                    {item.recipeAttributions.length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {item.recipeAttributions
                          .map((a) => `${DAY_NAMES[(a.day - 1) % 7]}: ${a.title}`)
                          .join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroceryListPreview;
