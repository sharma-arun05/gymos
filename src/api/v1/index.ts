// ============================================================================
// Enterprise REST API v1 Boundary (api/v1)
// Legacy webhook ingestion & standard CRM lead creation endpoints.
// ============================================================================

import { supabase } from '../../lib/supabase';
import { LeadValidator } from '../../domains/crm/leads';

export class ApiV1Controller {
  /**
   * POST /api/v1/leads
   * Ingest lead from external landing pages or legacy form webhooks
   */
  static async createLead(reqBody: { gym_id: string; name: string; phone?: string; email?: string; source?: string }): Promise<{ status: number; data?: any; error?: string }> {
    try {
      const validated = LeadValidator.validateCreate({
        gym_id: reqBody.gym_id,
        name: reqBody.name,
        phone: reqBody.phone,
        email: reqBody.email,
        source: reqBody.source || 'API_V1',
        status: 'New',
      });

      const { data, error } = await supabase.from('leads').insert(validated).select().single();
      if (error) return { status: 400, error: error.message };

      return { status: 201, data };
    } catch (err: any) {
      return { status: 422, error: err.message };
    }
  }

  /**
   * GET /api/v1/health
   */
  static getHealth(): { status: number; body: { version: string; uptime: string; timestamp: string } } {
    return {
      status: 200,
      body: {
        version: 'v1.4.0',
        uptime: '99.99%',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
