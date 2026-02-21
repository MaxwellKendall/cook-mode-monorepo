import React from 'react';
import MealCard from './MealCard';

export interface WeekMeal {
  day: number;
  recipeId: string;
  title: string;
  imageUrl?: string;
  cookTime?: number;
}

interface WeekViewProps {
  meals: WeekMeal[];
  swappingDay: number | null;
  onSwap: (day: number) => void;
  planId?: string;
}

const WeekView: React.FC<WeekViewProps> = ({ meals, swappingDay, onSwap, planId }) => {
  const sorted = [...meals].sort((a, b) => a.day - b.day);

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Week</h2>
      <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {sorted.map((meal) => (
          <MealCard
            key={meal.day}
            day={meal.day}
            recipeId={meal.recipeId}
            title={meal.title}
            imageUrl={meal.imageUrl}
            cookTime={meal.cookTime}
            isSwapping={swappingDay === meal.day}
            onSwap={onSwap}
            planId={planId}
          />
        ))}
      </div>
    </div>
  );
};

export default WeekView;
