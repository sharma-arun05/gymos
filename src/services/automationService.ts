import { supabase } from '../lib/supabase';
import { getGymName, replaceTemplateVariables } from './baseService';
import { emailProvider } from '../providers/email/resend';
import { whatsappProvider } from '../providers/whatsapp/meta';
import type { AutomationLog, AutomationLogWithDetails, Lead, Template } from '../types/database';

export const automationService = {
  async getLogs(gymId: string): Promise<AutomationLogWithDetails[]> {
    const { data, error } = await supabase
      .from('automation_logs')
      .select(`
        *,
        leads ( name ),
        templates ( name )
      `)
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as unknown as AutomationLogWithDetails[];
  },

  async triggerManualFollowUp(
    gymId: string,
    lead: Lead, 
    template: Template
  ): Promise<AutomationLog> {
    const gymName = await getGymName(gymId);

    // 1. Variable Replacement — real gym name, real lead data
    const messageBody = replaceTemplateVariables(template.content, {
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      goal: lead.goal,
      gym_name: gymName,
    });
    
    // 2. Call external providers via Edge Functions
    if (template.channel === 'email' || template.channel === 'both') {
      if (lead.email) {
        await emailProvider.sendEmail(lead, template, messageBody, gymId);
      }
    }
    
    if (template.channel === 'whatsapp' || template.channel === 'both') {
      if (lead.phone) {
        await whatsappProvider.sendWhatsApp(lead, template, messageBody, gymId);
      }
    }
    
    // 3. Create Automation Log — log intent as 'Queued' or 'Sent' (the webhooks will update this to 'Delivered' etc.)
    const { data, error } = await supabase
      .from('automation_logs')
      .insert([{
        gym_id: gymId,
        lead_id: lead.id,
        template_id: template.id,
        channel: template.channel,
        status: 'Sent',
        message_preview: messageBody,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
