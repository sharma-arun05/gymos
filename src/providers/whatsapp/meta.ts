import { supabase } from '../../lib/supabase';
import type { Lead, Template } from '../../types/database';

export const whatsappProvider = {
  async sendWhatsApp(
    lead: Lead,
    template: Template,
    messageBody: string,
    gymId: string
  ): Promise<any> {
    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: {
        to: lead.phone,
        text: messageBody,
        gymId,
        leadId: lead.id,
        templateId: template.id
      }
    });

    if (error) {
      console.error("WhatsApp Provider Error:", error);
      throw error;
    }

    return data;
  }
};
