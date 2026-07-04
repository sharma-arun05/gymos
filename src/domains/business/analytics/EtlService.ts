// ============================================================================
// Data Warehouse ETL Aggregator Service (business/analytics)
// Transforms operational OLTP data into Star Schema facts & dimensions.
// ============================================================================

import { supabase } from '../../../lib/supabase';
import { eventBus } from '../../../events/EventBus';

export class EtlService {
  /**
   * Run full daily ETL sync from OLTP tables to Star Schema Fact/Dim tables
   */
  static async runDailyEtl(gymId: string): Promise<{ recordsSynced: number; durationMs: number }> {
    const startTime = Date.now();
    let recordsSynced = 0;
    const todayIso = new Date().toISOString().split('T')[0];

    try {
      // 1. Sync dim_leads dimension table
      const { data: leads } = await supabase.from('leads').select('*').eq('gym_id', gymId);
      if (leads && leads.length > 0) {
        for (const lead of leads) {
          await supabase.from('dim_leads').upsert({
            lead_id: lead.id,
            gym_id: gymId,
            status: lead.status,
            source: lead.source || 'Website',
            created_date: lead.created_at.split('T')[0],
          }, { onConflict: 'lead_id' });
          recordsSynced++;
        }
      }

      // 2. Aggregate fact_leads for today
      const { count: newCount } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('gym_id', gymId).gte('created_at', `${todayIso}T00:00:00`);
      const { count: contactCount } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('gym_id', gymId).eq('status', 'Contacted');
      const { count: trialCount } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('gym_id', gymId).eq('status', 'Trial Booked');
      const { count: joinedCount } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('gym_id', gymId).eq('status', 'Joined');

      await supabase.from('fact_leads').upsert({
        gym_id: gymId,
        date_id: todayIso,
        new_leads: newCount || 0,
        contacted_leads: contactCount || 0,
        trials_scheduled: trialCount || 0,
        conversions: joinedCount || 0,
      }, { onConflict: 'gym_id,date_id' });
      recordsSynced++;

      // 3. Aggregate fact_revenue
      const { data: conversions } = await supabase.from('member_conversions').select('revenue_amount, commission_amount').eq('gym_id', gymId).gte('converted_at', `${todayIso}T00:00:00`);
      const totalRev = conversions?.reduce((sum, c) => sum + Number(c.revenue_amount || 0), 0) || 0;
      const totalComm = conversions?.reduce((sum, c) => sum + Number(c.commission_amount || 0), 0) || 0;

      await supabase.from('fact_revenue').upsert({
        gym_id: gymId,
        date_id: todayIso,
        mrr_added: totalRev,
        arr_added: totalRev * 12,
        commissions_paid: totalComm,
      }, { onConflict: 'gym_id,date_id' });
      recordsSynced++;

      const durationMs = Date.now() - startTime;

      // Emit event
      await eventBus.emit({
        id: crypto.randomUUID(),
        eventName: 'WorkflowCompleted',
        gymId,
        timestamp: new Date().toISOString(),
        payload: {
          executionId: crypto.randomUUID(),
          workflowVersionId: 'etl-daily-v1',
          status: 'completed',
        },
      });

      return { recordsSynced, durationMs };
    } catch (err: any) {
      console.error(`EtlService: Daily ETL failed for gym [${gymId}]:`, err);
      throw new Error(`ETL Aggregation error: ${err.message}`);
    }
  }
}
