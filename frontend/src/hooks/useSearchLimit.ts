'use client';

import { useState, useEffect, useCallback } from 'react';
// CLERK AUTH TEMPORARILY DISABLED - Uncomment when needed
// import { useAuth } from '@clerk/nextjs';

const STORAGE_KEY = 'search_count';
const SOFT_LIMIT = 2;  // After 2 searches, show blur + banner
const HARD_LIMIT = 4;  // After 4 searches, hard block

export type LimitState = 'free' | 'soft' | 'hard';

export function useSearchLimit() {
  // CLERK AUTH TEMPORARILY DISABLED - Replace with actual auth when needed
  // const { isSignedIn, isLoaded } = useAuth();
  const isSignedIn = false; // Temporary: treat all users as signed in (no limits)
  const isLoaded = true;
  
  const [searchCount, setSearchCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Load from sessionStorage on mount
  useEffect(() => {
    setMounted(true);
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSearchCount(parseInt(stored, 10) || 0);
    }
  }, []);

  // Reset count when user signs in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      sessionStorage.removeItem(STORAGE_KEY);
      setSearchCount(0);
    }
  }, [isLoaded, isSignedIn]);

  const incrementSearch = useCallback(() => {
    // Don't count if signed in
    if (isSignedIn) return;
    
    setSearchCount(prev => {
      const newCount = prev + 1;
      sessionStorage.setItem(STORAGE_KEY, newCount.toString());
      return newCount;
    });
  }, [isSignedIn]);

  const getLimitState = useCallback((): LimitState => {
    if (!mounted || isSignedIn) return 'free';
    if (searchCount > HARD_LIMIT) return 'hard';
    if (searchCount > SOFT_LIMIT) return 'soft';
    return 'free';
  }, [mounted, isSignedIn, searchCount]);

  const resetCount = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setSearchCount(0);
  }, []);

  return {
    searchCount,
    incrementSearch,
    limitState: getLimitState(),
    isAtSoftLimit: searchCount > SOFT_LIMIT && !isSignedIn,
    isAtHardLimit: searchCount > HARD_LIMIT && !isSignedIn,
    resetCount,
    remainingFreeSearches: Math.max(0, SOFT_LIMIT - searchCount + 1),
  };
}
