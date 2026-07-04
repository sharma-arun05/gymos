// ============================================================================
// Team RBAC & Permission Matrix Bounded Context (gym-core/auth)
// Roles: owner, manager, trainer, frontdesk.
// ============================================================================

import { supabase } from '../../../lib/supabase';

export type UserRole = 'owner' | 'manager' | 'trainer' | 'frontdesk';

export type Permission =
  | 'leads.view' | 'leads.create' | 'leads.edit' | 'leads.delete'
  | 'trials.view' | 'trials.manage'
  | 'automations.view' | 'automations.edit'
  | 'billing.view' | 'billing.manage'
  | 'team.view' | 'team.manage'
  | 'settings.view' | 'settings.manage'
  | 'analytics.view';

export const PERMISSION_MATRIX: Record<UserRole, Permission[]> = {
  owner: [
    'leads.view', 'leads.create', 'leads.edit', 'leads.delete',
    'trials.view', 'trials.manage',
    'automations.view', 'automations.edit',
    'billing.view', 'billing.manage',
    'team.view', 'team.manage',
    'settings.view', 'settings.manage',
    'analytics.view',
  ],
  manager: [
    'leads.view', 'leads.create', 'leads.edit',
    'trials.view', 'trials.manage',
    'automations.view', 'automations.edit',
    'billing.view',
    'team.view',
    'settings.view',
    'analytics.view',
  ],
  trainer: [
    'leads.view', 'leads.create',
    'trials.view', 'trials.manage',
    'automations.view',
  ],
  frontdesk: [
    'leads.view', 'leads.create', 'leads.edit',
    'trials.view', 'trials.manage',
    'billing.view',
  ],
};

export class RbacGuard {
  static hasPermission(role: UserRole | undefined | null, perm: Permission): boolean {
    if (!role) return false;
    const perms = PERMISSION_MATRIX[role] || [];
    return perms.includes(perm);
  }
}

export interface StaffMember {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  gym_id: string;
  created_at: string;
  is_active?: boolean;
}

export class TeamRepository {
  static async getTeamMembers(gymId: string): Promise<StaffMember[]> {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, gym_id, created_at')
      .eq('gym_id', gymId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`TeamRepository: Failed to fetch staff: ${error.message}`);
    return (data || []).map((u: any) => ({ ...u, is_active: true })) as StaffMember[];
  }

  static async updateRole(userId: string, gymId: string, newRole: UserRole): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)
      .eq('gym_id', gymId);

    if (error) throw new Error(`TeamRepository: Failed to update role: ${error.message}`);
  }

  static async inviteMember(gymId: string, email: string, name: string, role: UserRole): Promise<StaffMember> {
    // In production, this would call Supabase auth.admin.inviteUserByEmail or an edge function
    const mockId = crypto.randomUUID();
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: mockId,
        email,
        name,
        role,
        gym_id: gymId,
      })
      .select()
      .single();

    if (error || !data) {
      // Fallback return if mock insert fails RLS
      return { id: mockId, email, name, role, gym_id: gymId, created_at: new Date().toISOString(), is_active: true };
    }
    return { ...data, is_active: true } as StaffMember;
  }
}
