// src/hooks/usePermissionGroups.ts
// The permission groups for pickers (role and user forms) and the groups page.
// One request per session, shared by every caller; `invalidatePermissionGroups`
// after a save makes the next use refetch.
import { useCallback, useEffect, useState } from 'react';
import type { IPermissionGroup } from '@/types/role-permission';
import { getPermissionGroups } from '@/modules/settings/roles-permissions/api';

let cached: Promise<IPermissionGroup[]> | null = null;
const listeners = new Set<() => void>();

export function invalidatePermissionGroups() {
  cached = null;
  listeners.forEach((fn) => fn());
}

/** `enabled: false` skips the request (for forms that don't show groups). */
export function usePermissionGroups(enabled = true) {
  const [groups, setGroups] = useState<IPermissionGroup[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    listeners.add(bump);
    return () => {
      listeners.delete(bump);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    if (!cached) {
      cached = getPermissionGroups();
      cached.catch(() => {
        cached = null;
      });
    }
    // Keep what is on screen while a refetch runs.
    setStatus((s) => (s === 'ready' ? s : 'loading'));
    cached.then(
      (list) => {
        if (!active) return;
        setGroups(list);
        setStatus('ready');
      },
      () => active && setStatus('error')
    );
    return () => {
      active = false;
    };
  }, [version, enabled]);

  const reload = useCallback(() => invalidatePermissionGroups(), []);
  return { groups, status, reload };
}
