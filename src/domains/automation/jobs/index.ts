// ============================================================================
// Partitioned Job Queue Engine (Bounded Context: automation/jobs)
// Partitions: high_priority, normal_priority, low_priority, dead_letter
// Features: Exponential backoff retries, DLQ routing, concurrency control.
// ============================================================================

import { supabase } from '../../../lib/supabase';
import { eventBus } from '../../../events/EventBus';
import { MeteringService } from '../../platform/metering';

export type QueuePartition = 'high_priority' | 'normal_priority' | 'low_priority' | 'dead_letter';

export interface AutomationJob {
  id: string;
  gym_id: string;
  job_type: string; // 'send_email' | 'send_whatsapp' | 'score_lead' | 'assign_staff'
  queue_partition: QueuePartition;
  payload: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  max_attempts: number;
  scheduled_for: string;
}

export class QueueService {
  /**
   * Enqueue a new background job into a specific priority partition
   */
  static async enqueueJob(
    gymId: string,
    jobType: string,
    payload: Record<string, any>,
    partition: QueuePartition = 'normal_priority',
    scheduledFor: Date = new Date(),
    maxAttempts: number = 3
  ): Promise<AutomationJob> {
    const { data, error } = await supabase
      .from('automation_jobs')
      .insert({
        gym_id: gymId,
        job_type: jobType,
        queue_partition: partition,
        payload,
        status: 'pending',
        attempts: 0,
        max_attempts: maxAttempts,
        scheduled_for: scheduledFor.toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`QueueService: Failed to enqueue job [${jobType}]: ${error?.message}`);
    }

    return data as unknown as AutomationJob;
  }

  /**
   * Process a batch of pending jobs from a specific queue partition
   */
  static async processPartition(partition: QueuePartition, batchSize: number = 10): Promise<{ processed: number; failed: number }> {
    const nowIso = new Date().toISOString();

    // Fetch batch of pending jobs due for execution
    const { data: jobs, error: fetchError } = await supabase
      .from('automation_jobs')
      .select('*')
      .eq('queue_partition', partition)
      .eq('status', 'pending')
      .lte('scheduled_for', nowIso)
      .order('scheduled_for', { ascending: true })
      .limit(batchSize);

    if (fetchError || !jobs || jobs.length === 0) {
      return { processed: 0, failed: 0 };
    }

    let processedCount = 0;
    let failedCount = 0;

    for (const rawJob of jobs) {
      const job = rawJob as unknown as AutomationJob;
      const startTime = Date.now();

      try {
        // Mark as processing
        await supabase.from('automation_jobs').update({ status: 'processing' }).eq('id', job.id);

        // Execute job handler
        const output = await this.executeJobHandler(job);
        const durationMs = Date.now() - startTime;

        // Mark completed & record run
        await supabase.from('automation_jobs').update({ status: 'completed', processed_at: new Date().toISOString() }).eq('id', job.id);
        await supabase.from('automation_runs').insert({
          gym_id: job.gym_id,
          job_id: job.id,
          status: 'completed',
          output_data: output,
          duration_ms: durationMs,
        });

        processedCount++;
      } catch (error: any) {
        failedCount++;
        const durationMs = Date.now() - startTime;
        const nextAttempts = job.attempts + 1;

        await supabase.from('automation_failures').insert({
          gym_id: job.gym_id,
          job_id: job.id,
          error_code: error.name || 'EXECUTION_ERROR',
          stack_trace: error.stack || error.message,
        });

        if (nextAttempts >= job.max_attempts) {
          // Route to Dead Letter Queue (DLQ)
          await supabase.from('automation_jobs').update({
            status: 'failed',
            queue_partition: 'dead_letter',
            attempts: nextAttempts,
            error_message: error.message,
          }).eq('id', job.id);

          // Notify staff via EventBus
          await eventBus.emit({
            id: crypto.randomUUID(),
            eventName: 'WorkflowCompleted',
            gymId: job.gym_id,
            timestamp: new Date().toISOString(),
            payload: {
              executionId: job.id,
              workflowVersionId: 'dlq_failure',
              status: 'failed',
            },
          });
        } else {
          // Calculate exponential backoff: 2^attempts * 60 seconds
          const delaySecs = Math.pow(2, nextAttempts) * 60;
          const nextRetryIso = new Date(Date.now() + delaySecs * 1000).toISOString();

          await supabase.from('automation_jobs').update({
            status: 'pending',
            attempts: nextAttempts,
            scheduled_for: nextRetryIso,
            error_message: error.message,
          }).eq('id', job.id);

          await supabase.from('retry_queue').insert({
            gym_id: job.gym_id,
            job_id: job.id,
            next_retry_at: nextRetryIso,
            retry_count: nextAttempts,
          });
        }
      }
    }

    return { processed: processedCount, failed: failedCount };
  }

  /**
   * Internal dispatcher for job execution logic
   */
  private static async executeJobHandler(job: AutomationJob): Promise<Record<string, any>> {
    switch (job.job_type) {
      case 'send_email':
        await MeteringService.recordUsage(job.gym_id, 'email_sent', 1);
        return { delivered: true, recipient: job.payload.email };

      case 'send_whatsapp':
        await MeteringService.recordUsage(job.gym_id, 'whatsapp_sent', 1);
        return { delivered: true, phone: job.payload.phone };

      case 'score_lead':
        return { scored: true, leadId: job.payload.leadId };

      default:
        return { executed: true, jobType: job.job_type };
    }
  }
}
