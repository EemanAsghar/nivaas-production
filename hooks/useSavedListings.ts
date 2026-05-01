'use client';

import { useState, useCallback } from 'react';

export function useSavedListings(initialIds: string[] = []) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set(initialIds));
  const [pending,  setPending]  = useState<Set<string>>(new Set());

  const toggle = useCallback(async (listingId: string) => {
    if (pending.has(listingId)) return;

    const isSaved = savedIds.has(listingId);
    setPending(p => new Set(p).add(listingId));

    // Optimistic update
    setSavedIds(prev => {
      const next = new Set(prev);
      if (isSaved) next.delete(listingId);
      else next.add(listingId);
      return next;
    });

    try {
      await fetch(`/api/listings/${listingId}/save`, {
        method: isSaved ? 'DELETE' : 'POST',
      });
    } catch {
      // Roll back on error
      setSavedIds(prev => {
        const next = new Set(prev);
        if (isSaved) next.add(listingId);
        else next.delete(listingId);
        return next;
      });
    } finally {
      setPending(p => {
        const next = new Set(p);
        next.delete(listingId);
        return next;
      });
    }
  }, [savedIds, pending]);

  return { savedIds, toggle, isPending: (id: string) => pending.has(id) };
}
