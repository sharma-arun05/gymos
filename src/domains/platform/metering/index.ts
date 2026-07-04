// ============================================================================
// Usage Metering & Quota Service (Bounded Context: platform/metering)
// Enforces plan tier quotas for leads, automations, communications, & storage.
// ============================================================================

import { supabase } from '../../../lib/supabase';

export type MetricName = 'leads' | 'automations' | 'whatsapp_sent' | 'email_sent' | 'storage_mb' | 'ai_tokens';

export interface QuotaStatus {
  metricName: MetricName;
  currentValue: number;
  quotaLimit: number; // -1 indicates unlimited
  isExceeded: boolean;
  percentageUsed: number;
}

export class MeteringService {
  private static readonly PLAN_QUOTAS: Record<string, Record<MetricName, number>> = {
    Starter: {
      leads: 1000,
      automations: 500,
      whatsapp_sent: 500,
      email_sent: 2000,
      storage_mb: 1024, // 1 GB
      ai_tokens: 50000,
    },
    Growth: {
      leads: 10000,
      automations: 5000,
      whatsapp_sent: 5000,
      email_sent: 20000,
      storage_mb: 10240, // 10 GB
      ai_tokens: 200000,
    },
    Pro: {
      leads: -1, // Unlimited
      automations: -1,
      whatsapp_sent: -1,
      email_sent: -1,
      storage_mb: 102400, // 100 GB
      ai_tokens: -1,
    },
    Enterprise: {
      leads: -1,
      automations: -1,
      whatsapp_sent: -1,
      email_sent: -1,
      storage_mb: -1,
      ai_tokens: -1,
    },
  };

  /**
   * Check quota status for a specific metric
   */
  static async checkQuota(gymId: string, metricName: MetricName, plan: string = 'Starter'): Promise<QuotaStatus> {
    const planQuotas = this.PLAN_QUOTAS[plan] || this.PLAN_QUOTAS['Starter'];
    const limit = planQuotas[metricName] ?? 1000;

    if (limit === -1) {
      return {
        metricName,
        currentValue: 0,
        quotaLimit: -1,
        isExceeded: false,
        percentageUsed: 0,
      };
    }

    const { data: metricData, error } = await supabase
      .from('usage_metrics')
      .select('current_value')
      .eq('gym_id', gymId)
      .eq('metric_name', metricName)
      .single();

    const currentVal = (!error && metricData?.current_value) ? metricData.current_value : 0;
    const isExceeded = currentVal >= limit;
    const percentage = Math.min(Math.round((currentVal / limit) * 100), 100);

    return {
      metricName,
      currentValue: currentVal,
      quotaLimit: limit,
      isExceeded,
      percentageUsed: percentage,
    };
  }

  /**
   * Increment metric usage and verify quota bounds
   * Throws Error if quota is exceeded
   */
  static async recordUsage(gymId: string, metricName: MetricName, amount: number = 1, plan: string = 'Starter'): Promise<void> {
    const status = await this.checkQuota(gymId, metricName, plan);
    
    if (status.isExceeded) {
      throw new Error(`Plan Quota Exceeded: Your [${plan}] plan allows a maximum of ${status.quotaLimit} ${metricName}. Please upgrade your subscription to continue.`);
    }

    // Upsert incremented usage
    const newVal = status.currentValue + amount;
    await supabase.from('usage_metrics').upsert({
      gym_id: gymId,
      metric_name: metricName,
      current_value: newVal,
      quota_limit: status.quotaLimit,
    });
  }

  /**
   * Take daily snapshot for billing and executive telemetry
   */
  static async takeDailySnapshot(gymId: string, metricName: MetricName): Promise<void> {
    const { data: metric } = await supabase
      .from('usage_metrics')
      .select('current_value')
      .eq('gym_id', gymId)
      .eq('metric_name', metricName)
      .single();

    const val = metric?.current_value || 0;

    await supabase.from('usage_snapshots').insert({
      gym_id: gymId,
      metric_name: metricName,
      snapshot_value: val,
      snapshot_date: new Date().toISOString().split('T')[0],
    });
  }
}
