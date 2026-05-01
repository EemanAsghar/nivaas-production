'use client';

import { useState, useEffect } from 'react';

export function useUnreadCount(userId: string | undefined) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) { setCount(0); return; }

    let cancelled = false;

    async function fetchCount() {
      const res = await fetch('/api/conversations/unread');
      if (!res.ok || cancelled) return;
      const data = await res.json();
      setCount(data.count ?? 0);
    }

    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    window.addEventListener('focus', fetchCount);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('focus', fetchCount);
    };
  }, [userId]);

  return count;
}
