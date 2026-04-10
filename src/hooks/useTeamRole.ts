'use client';
import { useEffect, useState } from 'react';

export type TeamRole = 'owner' | 'admin' | 'read_only';

/**
 * Returns the current user's role in the workspace.
 * Calls /api/plan (which also handles auto-accepting pending invites)
 * so there's no race condition between invite acceptance and role resolution.
 */
export function useTeamRole() {
  const [role, setRole] = useState<TeamRole>('owner');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/plan');
        if (res.ok) {
          const data = await res.json();
          setRole((data.role as TeamRole) ?? 'owner');
        }
      } catch (e) {
        console.error('[useTeamRole] Error:', e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return {
    role,
    isOwner: role === 'owner',
    isAdmin: role === 'admin',
    isReadOnly: role === 'read_only',
    isLoading,
  };
}
