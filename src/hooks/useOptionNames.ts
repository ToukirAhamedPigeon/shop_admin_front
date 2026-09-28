// src/hooks/useOptionNames.ts
// Loads the names behind an Options endpoint ("/Options/roles",
// "/Options/permissions") for pickers. Replies are cached per URL for the
// session, so reopening a form doesn't refetch; `reload` forces a new request.
import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/axios';

const cache = new Map<string, Promise<string[]>>();

type Item = { name?: string; value?: string; label?: string };

function fetchNames(url: string): Promise<string[]> {
  return api.post(url, { search: '', limit: 1000, where: {}, sortBy: 'name', sortOrder: 'asc' }).then(({ data }) => {
    // Same reply shapes CustomSelect accepts.
    const list: unknown = Array.isArray(data) ? data : data?.data ?? data?.items ?? data?.results ?? Object.values(data ?? {}).find(Array.isArray);
    const items = Array.isArray(list) ? (list as Item[]) : [];
    const names = items.map((i) => String(i.name ?? i.value ?? i.label ?? '')).filter(Boolean);
    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
  });
}

/** Drops cached replies, e.g. after roles or permissions were created or changed. */
export function invalidateOptionNames(url?: string) {
  if (url) cache.delete(url);
  else cache.clear();
}

export function useOptionNames(url: string) {
  const [names, setNames] = useState<string[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    let request = cache.get(url);
    if (!request) {
      request = fetchNames(url);
      cache.set(url, request);
      // A failed request must not stay cached.
      request.catch(() => cache.delete(url));
    }
    request.then(
      (list) => {
        if (!active) return;
        setNames(list);
        setStatus('ready');
      },
      () => active && setStatus('error')
    );
    return () => {
      active = false;
    };
  }, [url, attempt]);

  const reload = useCallback(() => {
    cache.delete(url);
    setAttempt((n) => n + 1);
  }, [url]);

  return { names, status, reload };
}
