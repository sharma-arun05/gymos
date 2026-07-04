// ============================================================================
// Feature Flag Service & Hooks (Bounded Context: platform/feature-flags)
// Controls module access, beta rollouts, and plan-tier feature restrictions.
// ============================================================================

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useGym } from '../../../context/GymContext';

export interface FeatureFlag {
  key: string;
  description?: string;
  isEnabledDefault: boolean;
}

export interface TenantFeatureOverride {
  gymId: string;
  featureKey: string;
  isEnabled: boolean;
  overrides?: Record<string, any>;
}

export class FeatureFlagService {
  /**
   * Check if a feature is enabled for a given tenant
   */
  static async isEnabled(gymId: string, featureKey: string, plan: string = 'Starter'): Promise<boolean> {
    if (!gymId) return false;

    // Check plan-based hard restrictions first
    const planRestrictions: Record<string, string[]> = {
      Starter: ['ai_followup_writer', 'data_warehouse_etl', 'superadmin_portal', 'custom_domain'],
      Growth: ['data_warehouse_etl', 'superadmin_portal'],
      Pro: [],
      Enterprise: [],
    };

    const restrictedInPlan = planRestrictions[plan] || [];
    if (restrictedInPlan.includes(featureKey)) {
      return false;
    }

    // Check database override in tenant_features
    const { data: tenantOverride, error: tenantError } = await supabase
      .from('tenant_features')
      .select('is_enabled')
      .eq('gym_id', gymId)
      .eq('feature_key', featureKey)
      .single();

    if (!tenantError && tenantOverride) {
      return tenantOverride.is_enabled;
    }

    // Fallback to global feature_flags default
    const { data: globalFlag, error: globalError } = await supabase
      .from('feature_flags')
      .select('is_enabled_default')
      .eq('key', featureKey)
      .single();

    if (!globalError && globalFlag) {
      return globalFlag.is_enabled_default;
    }

    // Default to true for standard core modules if flag not explicitly configured
    return true;
  }

  /**
   * Toggle feature for a tenant (Admin/Owner only)
   */
  static async toggleFeature(gymId: string, featureKey: string, isEnabled: boolean): Promise<void> {
    const { error } = await supabase.from('tenant_features').upsert({
      gym_id: gymId,
      feature_key: featureKey,
      is_enabled: isEnabled,
    });

    if (error) {
      throw new Error(`Failed to toggle feature flag [${featureKey}]: ${error.message}`);
    }
  }
}

/**
 * React Hook to check feature flag status reactively
 */
export function useFeatureFlag(featureKey: string, defaultVal: boolean = true): { enabled: boolean; loading: boolean } {
  const { gymId, plan } = useGym();
  const [enabled, setEnabled] = useState<boolean>(defaultVal);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    if (!gymId) {
      setLoading(false);
      return;
    }

    FeatureFlagService.isEnabled(gymId, featureKey, plan || 'Starter')
      .then((res) => {
        if (isMounted) {
          setEnabled(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(`useFeatureFlag error for [${featureKey}]:`, err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [gymId, featureKey, plan]);

  return { enabled, loading };
}
