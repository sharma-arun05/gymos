// ============================================================================
// Tenancy Isolation Layer (Bounded Context: gym-core/tenancy)
// Enforces: Request -> Auth -> TenantResolver -> TenantCache -> RLS
// ============================================================================

import { useGym } from '../../../context/GymContext';
import { supabase } from '../../../lib/supabase';

export interface TenantContextData {
  gymId: string;
  gymName: string;
  plan: 'Starter' | 'Growth' | 'Pro' | 'Enterprise';
  role: 'owner' | 'manager' | 'sales' | 'trainer' | 'support';
}

/**
 * TenantCache: In-memory cache for fast tenant resolution
 */
class TenantCache {
  private cache: Map<string, { data: TenantContextData; timestamp: number }> = new Map();
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

  get(key: string): TenantContextData | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > this.TTL_MS) {
      this.cache.delete(key);
      return null;
    }
    return cached.data;
  }

  set(key: string, data: TenantContextData): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(key?: string): void {
    if (key) this.cache.delete(key);
    else this.cache.clear();
  }
}

export const tenantCache = new TenantCache();

/**
 * TenantResolver: Resolves the tenant context for the current authenticated user
 */
export class TenantResolver {
  static async resolveFromAuth(): Promise<TenantContextData> {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      throw new Error('TenantResolver: Unauthorized - No authenticated session.');
    }

    const userId = authData.user.id;
    const cached = tenantCache.get(userId);
    if (cached) return cached;

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('gym_id, role, gyms(name, plan)')
      .eq('auth_user_id', userId)
      .single();

    if (userError || !userData || !userData.gym_id) {
      throw new Error('TenantResolver: Tenant not resolved - User has no assigned gym.');
    }

    const gymInfo = userData.gyms as unknown as { name: string; plan: string } | null;
    const tenantData: TenantContextData = {
      gymId: userData.gym_id,
      gymName: gymInfo?.name || 'My Gym',
      plan: (gymInfo?.plan as TenantContextData['plan']) || 'Starter',
      role: (userData.role as TenantContextData['role']) || 'owner',
    };

    tenantCache.set(userId, tenantData);
    return tenantData;
  }
}

/**
 * useTenant: React Hook to securely consume tenant context with RLS guarantees
 */
export function useTenant(): TenantContextData {
  const { gymId, gymName, plan, role, loading } = useGym();
  
  if (!loading && !gymId) {
    console.warn('useTenant: No active tenant ID resolved in current context.');
  }

  return {
    gymId: gymId || '',
    gymName: gymName || 'My Gym',
    plan: (plan as TenantContextData['plan']) || 'Starter',
    role: (role as TenantContextData['role']) || 'owner',
  };
}

/**
 * TenantGuard: Validates that a target gymId matches the authenticated tenant context
 */
export class TenantGuard {
  static verify(targetGymId: string, contextGymId: string): void {
    if (!targetGymId || targetGymId !== contextGymId) {
      throw new Error(`TenantGuard Violation: Attempted access to mismatched tenant [${targetGymId}] from context [${contextGymId}].`);
    }
  }
}
