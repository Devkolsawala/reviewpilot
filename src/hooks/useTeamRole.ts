'use client';
import { useEffect, useState } from 'react';

export type TeamRole = 'owner' | 'admin' | 'operator' | 'read_only';

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
    isOperator: role === 'operator',
    isReadOnly: role === 'read_only',
    // True when the user can edit AI configuration (tone, app context,
    // auto-reply rules). Operator and read_only cannot.
    canEditAIConfig: role === 'owner' || role === 'admin',
    // True when the user can post replies (manual + AI generate).
    // Only read_only is blocked.
    canReply: role !== 'read_only',
    // True when the user can add / remove connections (Play Store, GBP, WhatsApp).
    canManageConnections: role === 'owner' || role === 'admin' || role === 'operator',
    isLoading,
  };
}
