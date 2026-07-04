// ============================================================================
// Lead CRM Bounded Context (crm/leads)
// Layering: LeadRepository -> LeadScoringService -> CreateLeadUseCase.
// Features: Algorithmic Lead Scoring (0-100), State Machine verification, EventBus.
// ============================================================================

import { supabase } from '../../../lib/supabase';
import { eventBus } from '../../../events/EventBus';
import { LeadStateMachine, LeadState } from '../../shared/state-machines';
import { MeteringService } from '../../platform/metering';

export interface Lead {
  id: string;
  gym_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  status: LeadState;
  goal?: string | null;
  notes?: string | null;
  assigned_to?: string | null;
  created_at: string;
  score?: number;
  tier?: 'Hot' | 'Warm' | 'Cold';
}

export interface LeadScoreResult {
  scoreNumeric: number;
  tier: 'Hot' | 'Warm' | 'Cold';
  factors: { label: string; points: number }[];
}

/**
 * LeadRepository: Encapsulates database operations for CRM leads
 */
export class LeadRepository {
  static async getLeads(gymId: string): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('leads')
      .select('*, lead_scores(score_numeric, tier)')
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`LeadRepository: Failed to fetch leads: ${error.message}`);
    
    return (data || []).map((row: any) => ({
      ...row,
      score: row.lead_scores?.score_numeric || 0,
      tier: row.lead_scores?.tier || 'Cold',
    }));
  }

  static async getLeadById(gymId: string, leadId: string): Promise<Lead | null> {
    const { data, error } = await supabase
      .from('leads')
      .select('*, lead_scores(score_numeric, tier)')
      .eq('gym_id', gymId)
      .eq('id', leadId)
      .single();

    if (error || !data) return null;
    return {
      ...data,
      score: data.lead_scores?.score_numeric || 0,
      tier: data.lead_scores?.tier || 'Cold',
    } as unknown as Lead;
  }

  static async createLead(gymId: string, leadData: Partial<Lead>): Promise<Lead> {
    const { data, error } = await supabase
      .from('leads')
      .insert({
        gym_id: gymId,
        name: leadData.name,
        email: leadData.email || null,
        phone: leadData.phone || null,
        status: leadData.status || 'New',
        goal: leadData.goal || null,
        notes: leadData.notes || null,
      })
      .select()
      .single();

    if (error || !data) throw new Error(`LeadRepository: Failed to create lead: ${error?.message}`);
    return data as unknown as Lead;
  }

  static async updateStatus(gymId: string, leadId: string, newStatus: LeadState): Promise<void> {
    // 1. Verify existing lead & validate state machine transition
    const existing = await this.getLeadById(gymId, leadId);
    if (!existing) throw new Error(`Lead [${leadId}] not found in gym [${gymId}].`);
    
    LeadStateMachine.transition(existing.status, newStatus);

    // 2. Perform mutation
    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus })
      .eq('gym_id', gymId)
      .eq('id', leadId);

    if (error) throw new Error(`LeadRepository: Failed to update status: ${error.message}`);

    // 3. Log activity
    await supabase.from('lead_activity').insert({
      gym_id: gymId,
      lead_id: leadId,
      activity_type: 'status_change',
      description: `Status transitioned from [${existing.status}] to [${newStatus}]`,
    });
  }
}

/**
 * LeadScoringService: Algorithmic calculation of lead conversion probability (0-100)
 */
export class LeadScoringService {
  static calculateScore(lead: Partial<Lead>, activityCount: number = 0, hasTrial: boolean = false): LeadScoreResult {
    let score = 10; // Base score for filling inquiry
    const factors: { label: string; points: number }[] = [{ label: 'Inquiry Form Submitted', points: 10 }];

    if (lead.phone && lead.phone.trim().length >= 10) {
      score += 20;
      factors.push({ label: 'Valid Phone Number Provided', points: 20 });
    }

    if (lead.email && lead.email.includes('@')) {
      score += 15;
      factors.push({ label: 'Valid Email Provided', points: 15 });
    }

    if (lead.goal && lead.goal.trim().length > 0) {
      score += 15;
      factors.push({ label: 'Specific Fitness Goal Declared', points: 15 });
    }

    if (hasTrial) {
      score += 30;
      factors.push({ label: 'VIP Trial Session Booked', points: 30 });
    }

    if (activityCount > 0) {
      const actPoints = Math.min(activityCount * 5, 20);
      score += actPoints;
      factors.push({ label: `Engagement Activities (${activityCount})`, points: actPoints });
    }

    // Clamp score between 0 and 100
    const scoreNumeric = Math.min(Math.max(score, 0), 100);
    const tier = scoreNumeric >= 80 ? 'Hot' : scoreNumeric >= 50 ? 'Warm' : 'Cold';

    return { scoreNumeric, tier, factors };
  }

  static async evaluateAndPersist(gymId: string, leadId: string): Promise<LeadScoreResult> {
    const lead = await LeadRepository.getLeadById(gymId, leadId);
    if (!lead) throw new Error('Lead not found for scoring.');

    const { count: actCount } = await supabase.from('lead_activity').select('*', { count: 'exact', head: true }).eq('lead_id', leadId);
    const { count: trialCount } = await supabase.from('trial_bookings').select('*', { count: 'exact', head: true }).eq('lead_id', leadId);

    const result = this.calculateScore(lead, actCount || 0, (trialCount || 0) > 0);

    // Upsert into lead_scores
    await supabase.from('lead_scores').upsert({
      gym_id: gymId,
      lead_id: leadId,
      score_numeric: result.scoreNumeric,
      tier: result.tier,
      factors: result.factors as any,
    });

    return result;
  }
}

/**
 * LeadValidator: Zod-style validation for CRM leads
 */
export class LeadValidator {
  static validateCreate(data: any): any {
    if (!data || !data.gym_id || !data.name) {
      throw new Error('Validation Error: gym_id and name are required fields.');
    }
    return {
      gym_id: data.gym_id,
      name: data.name.trim(),
      phone: data.phone || null,
      email: data.email || null,
      status: data.status || 'New',
      source: data.source || 'Manual',
      goal: data.goal || null,
    };
  }
}

/**
 * CreateLeadUseCase: Orchestrates new lead acquisition pipeline
 */
export class CreateLeadUseCase {
  static async execute(gymId: string, leadData: Partial<Lead>, plan: string = 'Starter'): Promise<Lead> {
    // 1. Enforce lead ingestion metering quota
    await MeteringService.recordUsage(gymId, 'leads', 1, plan);

    // 2. Validate initial state machine state
    const status = leadData.status || 'New';
    LeadStateMachine.canTransition('New', status);

    // 3. Create lead record
    const lead = await LeadRepository.createLead(gymId, { ...leadData, status });

    // 4. Calculate initial lead score
    await LeadScoringService.evaluateAndPersist(gymId, lead.id);

    // 5. Log activity
    await supabase.from('lead_activity').insert({
      gym_id: gymId,
      lead_id: lead.id,
      activity_type: 'note',
      description: 'Lead acquired into system via CRM.',
    });

    // 6. Emit type-safe domain event via EventBus
    await eventBus.emit({
      id: crypto.randomUUID(),
      eventName: 'LeadCreated',
      gymId,
      timestamp: new Date().toISOString(),
      payload: {
        leadId: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        goal: lead.goal,
        source: 'CRM Manual Intake',
      },
    });

    return lead;
  }
}
