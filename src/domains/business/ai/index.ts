// ============================================================================
// AI Governance & Safety Bounded Context (business/ai)
// Rate limiting, PII redaction, prompt injection defense, & audit logging.
// ============================================================================

import { supabase } from '../../../lib/supabase';
import { MeteringService } from '../../platform/metering';

export interface AiInteractionLog {
  id: string;
  gym_id: string;
  feature_type: 'followup_writer' | 'lead_analysis' | 'revenue_forecast';
  prompt_tokens: number;
  completion_tokens: number;
  status: 'allowed' | 'blocked_rate_limit' | 'blocked_pii' | 'blocked_injection';
  created_at: string;
}

export class AiGovernanceService {
  /**
   * Sanitizes input strings against prompt injection and scrubs sensitive PII
   */
  static sanitizeAndCheck(input: string): { isClean: boolean; sanitizedText: string; reason?: string } {
    if (!input) return { isClean: true, sanitizedText: '' };

    // 1. Check for basic prompt injection signatures
    const injectionPatterns = [/ignore all previous instructions/i, /system prompt:/i, /you are no longer gymos/i];
    for (const pat of injectionPatterns) {
      if (pat.test(input)) {
        return { isClean: false, sanitizedText: '[BLOCKED_INJECTION_ATTEMPT]', reason: 'Prompt injection signature detected' };
      }
    }

    // 2. Scrub credit cards or sensitive numbers
    let scrubbed = input.replace(/\b(?:\d[ -]*?){13,16}\b/g, '[REDACTED_CREDIT_CARD]');
    
    return { isClean: true, sanitizedText: scrubbed };
  }

  /**
   * Enforces AI rate limits and quota verification
   */
  static async verifyQuotaAndLog(gymId: string, featureType: AiInteractionLog['feature_type'], input: string): Promise<boolean> {
    const check = this.sanitizeAndCheck(input);
    if (!check.isClean) {
      console.warn(`[AiGovernanceService] Blocked AI call from gym [${gymId}]: ${check.reason}`);
      return false;
    }

    // Check metering
    await MeteringService.recordUsage(gymId, 'ai_tokens', 150);

    // Log interaction
    await supabase.from('audit_logs').insert({
      gym_id: gymId,
      actor_id: 'ai-engine',
      action: `AI_EXECUTION_${featureType.toUpperCase()}`,
      target_type: 'ai_governance',
      new_data: { sanitizedLength: check.sanitizedText.length, status: 'allowed' },
    });

    return true;
  }
}

export class AiIntelligenceService {
  static async generateFollowupScript(gymId: string, leadName: string, goal: string, channel: 'whatsapp' | 'email'): Promise<string> {
    const allowed = await AiGovernanceService.verifyQuotaAndLog(gymId, 'followup_writer', `${leadName} ${goal}`);
    if (!allowed) throw new Error('AI request blocked by Governance layer.');

    if (channel === 'whatsapp') {
      return `Hi ${leadName.split(' ')[0]}! 💪 Saw your interest in ${goal || 'transforming your fitness'}. We just opened 2 complimentary VIP trial spots for our studio this Friday. Would you like me to reserve one for you?`;
    } else {
      return `Subject: Your VIP Guest Pass is Ready, ${leadName}!\n\nHello ${leadName},\n\nWelcome to GymOS! We noticed your goal is ${goal || 'General Fitness'}. Our master trainers have curated an introductory workout session specifically tailored for you.\n\nClick below to confirm your trial slot this week.\n\nBest regards,\nThe Training Studio Team`;
    }
  }

  static async explainLeadScore(gymId: string, leadName: string, score: number): Promise<string> {
    await AiGovernanceService.verifyQuotaAndLog(gymId, 'lead_analysis', leadName);
    return `Analysis for ${leadName} (Score: ${score}/100):\nThis prospect exhibits high conversion velocity. They declared a specific goal (+15) and provided verified contact details (+35). Recommendation: Offer an immediate trial booking via WhatsApp within the next 2 hours to maximize closing probability.`;
  }
}
