// ============================================================================
// Trial Management Bounded Context (crm/trials)
// Layering: TrialRepository -> TrialStateMachine -> UseCases.
// Features: VIP Calendar booking, QR/Button attendance, Rating feedback, Star Schema sync.
// ============================================================================

import { supabase } from '../../../lib/supabase';
import { eventBus } from '../../../events/EventBus';
import { TrialStateMachine, TrialState } from '../../shared/state-machines';
import { LeadScoringService } from '../leads';

export interface TrialBooking {
  id: string;
  gym_id: string;
  lead_id: string;
  scheduled_time: string;
  status: TrialState;
  trainer_id?: string | null;
  notes?: string | null;
  created_at: string;
  leads?: { name: string; phone?: string; email?: string } | null;
}

export class TrialRepository {
  static async getTrials(gymId: string, startDate?: string, endDate?: string): Promise<TrialBooking[]> {
    let query = supabase
      .from('trial_bookings')
      .select('*, leads(name, phone, email)')
      .eq('gym_id', gymId)
      .order('scheduled_time', { ascending: true });

    if (startDate) query = query.gte('scheduled_time', startDate);
    if (endDate) query = query.lte('scheduled_time', endDate);

    const { data, error } = await query;
    if (error) throw new Error(`TrialRepository: Failed to fetch trials: ${error.message}`);
    return (data || []) as unknown as TrialBooking[];
  }

  static async createBooking(gymId: string, leadId: string, scheduledTime: Date, trainerId?: string, notes?: string): Promise<TrialBooking> {
    const { data, error } = await supabase
      .from('trial_bookings')
      .insert({
        gym_id: gymId,
        lead_id: leadId,
        scheduled_time: scheduledTime.toISOString(),
        status: 'SCHEDULED',
        trainer_id: trainerId || null,
        notes: notes || null,
      })
      .select('*, leads(name, phone, email)')
      .single();

    if (error || !data) throw new Error(`TrialRepository: Failed to book trial: ${error?.message}`);
    return data as unknown as TrialBooking;
  }

  static async updateStatus(gymId: string, trialId: string, newStatus: TrialState): Promise<void> {
    const { data: existing, error: getErr } = await supabase
      .from('trial_bookings')
      .select('*')
      .eq('gym_id', gymId)
      .eq('id', trialId)
      .single();

    if (getErr || !existing) throw new Error(`Trial [${trialId}] not found.`);

    TrialStateMachine.transition(existing.status as TrialState, newStatus);

    const { error } = await supabase
      .from('trial_bookings')
      .update({ status: newStatus })
      .eq('gym_id', gymId)
      .eq('id', trialId);

    if (error) throw new Error(`TrialRepository: Failed to update status: ${error.message}`);
  }
}

export class BookTrialUseCase {
  static async execute(gymId: string, leadId: string, scheduledTime: Date, trainerId?: string, notes?: string): Promise<TrialBooking> {
    // 1. Create booking
    const booking = await TrialRepository.createBooking(gymId, leadId, scheduledTime, trainerId, notes);

    // 2. Update lead status in CRM
    await supabase.from('leads').update({ status: 'Trial Booked' }).eq('id', leadId);

    // 3. Recalculate lead score (+30 for trial booking)
    await LeadScoringService.evaluateAndPersist(gymId, leadId);

    // 4. Emit domain event
    await eventBus.emit({
      id: crypto.randomUUID(),
      eventName: 'TrialBooked',
      gymId,
      timestamp: new Date().toISOString(),
      payload: {
        trialId: booking.id,
        leadId,
        scheduledTime: scheduledTime.toISOString(),
        trainerId,
      },
    });

    return booking;
  }
}

export class ConfirmAttendanceUseCase {
  static async execute(gymId: string, trialId: string, leadId: string, userId: string, rating?: number, comments?: string): Promise<void> {
    // 1. Update trial status
    await TrialRepository.updateStatus(gymId, trialId, 'ATTENDED');

    // 2. Record attendance timestamp
    await supabase.from('trial_attendance').insert({
      gym_id: gymId,
      trial_id: trialId,
      checked_in_by: userId,
    });

    // 3. Record feedback if provided
    if (rating) {
      await supabase.from('trial_feedback').insert({
        gym_id: gymId,
        trial_id: trialId,
        rating,
        comments: comments || null,
        interest_level: rating >= 4 ? 'High' : 'Medium',
      });
    }

    // 4. Update lead status to Trial Completed
    await supabase.from('leads').update({ status: 'Trial Completed' }).eq('id', leadId);

    // 5. Emit event
    await eventBus.emit({
      id: crypto.randomUUID(),
      eventName: 'TrialCompleted',
      gymId,
      timestamp: new Date().toISOString(),
      payload: {
        trialId,
        leadId,
        rating,
      },
    });
  }
}
