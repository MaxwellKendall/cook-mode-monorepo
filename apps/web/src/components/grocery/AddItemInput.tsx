import React, { useState } from 'react';

const CATEGORIES = [
  { id: 'produce', label: 'Produce' },
  { id: 'meat_seafood', label: 'Meat & Seafood' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'pantry', label: 'Pantry' },
  { id: 'frozen', label: 'Frozen' },
  { id: 'bakery', label: 'Bakery' },
  { id: 'other', label: 'Other' },
];

interface AddItemInputProps {
  onAdd: (name: string, category: string) => void;
  isAdding?: boolean;
}

const AddItemInput: React.FC<AddItemInputProps> = ({ onAdd, isAdding }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('other');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed, category);
    setName('');
    setShowCategoryPicker(false);
  };

  return (
    <div className="px-4 py-3 bg-white border-t border-gray-100">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add an item…"
          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          onFocus={() => setShowCategoryPicker(true)}
        />
        <button
          type="submit"
          disabled={!name.trim() || isAdding}
          className="px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-semibold rounded-xl transition-colors"
        >
          Add
        </button>
      </form>

      {showCategoryPicker && name.trim() && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                category === cat.id
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddItemInput;
