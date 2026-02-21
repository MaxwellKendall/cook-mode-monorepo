import React from 'react';

interface GroceryProgressProps {
  checked: number;
  total: number;
}

const GroceryProgress: React.FC<GroceryProgressProps> = ({ checked, total }) => {
  const pct = total === 0 ? 0 : Math.round((checked / total) * 100);
  const done = checked === total && total > 0;

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-800">
          {done ? '✓ All done!' : `${checked} of ${total} items`}
        </span>
        <span className="text-sm font-medium text-orange-500">{pct}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${done ? 'bg-green-500' : 'bg-orange-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default GroceryProgress;
