import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useGroceryList } from '../hooks/queries/useGroceryList';
import { useToggleGroceryItem } from '../hooks/mutations/useToggleGroceryItem';
import { useAddGroceryItem } from '../hooks/mutations/useAddGroceryItem';
import GroceryProgress from '../components/grocery/GroceryProgress';
import GrocerySection from '../components/grocery/GrocerySection';
import AddItemInput from '../components/grocery/AddItemInput';
import type { GroceryList } from '../services/groceryListService';

const GroceryListPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const { data: list, isLoading, error } = useGroceryList(id);
  const toggleMutation = useToggleGroceryItem();
  const addMutation = useAddGroceryItem();

  // Wake Lock — keep screen on while shopping
  useEffect(() => {
    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        }
      } catch {
        // Wake Lock not supported or denied — non-critical
      }
    }

    requestWakeLock();

    return () => {
      wakeLockRef.current?.release().catch(() => {});
    };
  }, []);

  // Re-acquire wake lock when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && 'wakeLock' in navigator) {
        navigator.wakeLock.request('screen')
          .then((lock) => { wakeLockRef.current = lock; })
          .catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleToggle = (itemId: string, checked: boolean) => {
    if (!id || !list) return;

    // Optimistic update
    queryClient.setQueryData(['groceryList', id], (old: GroceryList | undefined) => {
      if (!old) return old;
      return {
        ...old,
        progress: {
          total: old.progress.total,
          checked: checked
            ? old.progress.checked + 1
            : Math.max(0, old.progress.checked - 1),
        },
        sections: old.sections.map((section) => ({
          ...section,
          items: section.items.map((item) =>
            item.id === itemId ? { ...item, checked, checkedAt: checked ? new Date().toISOString() : null } : item
          ),
        })),
      };
    });

    toggleMutation.mutate({ listId: id, itemId, checked });
  };

  const handleAddItem = (name: string, category: string) => {
    if (!id) return;
    addMutation.mutate({ listId: id, item: { name, category } });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        <p className="mt-4 text-gray-400 text-sm">Loading your list…</p>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-white">
        <p className="text-gray-500 text-center mb-4">Could not load grocery list.</p>
        <button onClick={() => navigate(-1)} className="text-orange-500 font-medium">
          Go back
        </button>
      </div>
    );
  }

  // Flatten all items for the "Got it" section
  const allItems = list.sections.flatMap((s) => s.items);
  const checkedItems = allItems.filter((i) => i.checked);

  // Filter unchecked items per section
  const activeSections = list.sections
    .map((s) => ({ ...s, items: s.items.filter((i) => !i.checked) }))
    .filter((s) => s.items.length > 0);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Back nav */}
      <div className="flex items-center px-4 pt-4 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="flex-1 text-center text-base font-semibold text-gray-900 pr-10">
          Grocery List
        </h1>
      </div>

      {/* Sticky progress */}
      <GroceryProgress checked={list.progress.checked} total={list.progress.total} />

      {/* Add item */}
      <AddItemInput onAdd={handleAddItem} isAdding={addMutation.isPending} />

      {/* Active sections */}
      <div className="flex-1 overflow-y-auto">
        {activeSections.map((section) => (
          <GrocerySection
            key={section.category}
            category={section.category}
            label={section.label}
            items={section.items}
            onToggle={handleToggle}
          />
        ))}

        {/* Got it section */}
        {checkedItems.length > 0 && (
          <div className="mt-2">
            <div className="px-4 py-2 bg-gray-50">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                ✓ Got it ({checkedItems.length})
              </span>
            </div>
            {checkedItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleToggle(item.id, false)}
                className="w-full flex items-center gap-4 px-4 py-3.5 min-h-[52px] text-left hover:bg-gray-50 border-b border-gray-50 last:border-0"
              >
                <div className="w-6 h-6 flex-shrink-0 rounded-full border-2 border-green-500 bg-green-500 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-base text-gray-400 line-through">{item.name}</span>
              </button>
            ))}
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
};

export default GroceryListPage;
