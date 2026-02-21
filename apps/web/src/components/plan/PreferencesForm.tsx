import React, { useState } from 'react';
import type { WeeklyPlanPreferences } from '../../services/weeklyPlanService';

interface PreferencesFormProps {
  onSubmit: (preferences: WeeklyPlanPreferences) => void;
  isSubmitting: boolean;
}

const DIETARY_OPTIONS = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'gluten-free', label: 'Gluten-Free' },
  { id: 'dairy-free', label: 'Dairy-Free' },
  { id: 'low-carb', label: 'Low-Carb' },
];

function Stepper({
  value,
  min,
  max,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">{label}</label>
      <div className="inline-flex items-center gap-4">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center text-xl font-medium text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed hover:border-orange-400 hover:text-orange-600 transition-colors"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span className="w-8 text-center text-2xl font-bold text-gray-900">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center text-xl font-medium text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed hover:border-orange-400 hover:text-orange-600 transition-colors"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

const PreferencesForm: React.FC<PreferencesFormProps> = ({ onSubmit, isSubmitting }) => {
  const [servings, setServings] = useState(2);
  const [numDinners, setNumDinners] = useState(5);
  const [dietary, setDietary] = useState<string[]>([]);
  const [freeText, setFreeText] = useState('');

  const toggleDietary = (id: string) => {
    setDietary((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ servings, numDinners, dietary, freeText: freeText.trim() || undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-8">
      {/* Servings */}
      <Stepper
        label="How many people are you cooking for?"
        value={servings}
        min={1}
        max={8}
        onChange={setServings}
      />

      {/* Dinners */}
      <Stepper
        label="How many dinners this week?"
        value={numDinners}
        min={3}
        max={7}
        onChange={setNumDinners}
      />

      {/* Dietary */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Dietary preferences <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map((opt) => {
            const selected = dietary.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleDietary(opt.id)}
                className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-colors ${
                  selected
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Free text */}
      <div>
        <label htmlFor="freeText" className="block text-sm font-medium text-gray-700 mb-2">
          Anything else? <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="freeText"
          type="text"
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          placeholder="e.g. We love Thai food, no mushrooms, kid-friendly"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          maxLength={200}
        />
      </div>

      {/* CTA */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-lg font-semibold rounded-2xl transition-colors shadow-sm"
      >
        {isSubmitting ? 'Starting…' : 'Generate My Plan'}
      </button>
    </form>
  );
};

export default PreferencesForm;
