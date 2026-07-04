import { supabase } from '../../lib/supabase';
import type { Lead, Template } from '../../types/database';

export const emailProvider = {
  async sendEmail(
    lead: Lead,
    template: Template,
    messageBody: string,
    gymId: string
  ): Promise<any> {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: lead.email,
        subject: template.name, // Or we could add a subject field to templates later
        html: messageBody,
        gymId,
        leadId: lead.id,
        templateId: template.id
      }
    });

    if (error) {
      console.error("Email Provider Error:", error);
      throw error;
    }

    return data;
  }
};
