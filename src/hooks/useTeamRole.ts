'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type TeamRole = 'owner' | 'admin' | 'read_only';

export function useTeamRole() {
  const [role, setRole] = useState<TeamRole>('owner');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('owner_id')
        .eq('id', user.id)
        .single();

      if (!profile?.owner_id) {
        // No owner_id → this user is a workspace owner
        setRole('owner');
        setIsLoading(false);
        return;
      }

      // Has owner_id → look up role in team_members
      const { data: membership } = await supabase
        .from('team_members')
        .select('role')
        .eq('member_id', user.id)
        .eq('owner_id', profile.owner_id)
        .eq('status', 'active')
        .single();

      setRole((membership?.role as TeamRole) ?? 'read_only');
      setIsLoading(false);
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
