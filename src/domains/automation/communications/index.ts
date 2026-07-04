// ============================================================================
// Unified Communication Hub Service (Bounded Context: automation/communications)
// Manages multi-channel threads (WhatsApp, Email, SMS) with delivery tracking.
// ============================================================================

import { supabase } from '../../../lib/supabase';
import { QueueService } from '../jobs';

export interface MessageThread {
  leadId: string;
  leadName: string;
  leadPhone?: string | null;
  leadEmail?: string | null;
  lastMessageText: string;
  lastMessageAt: string;
  unreadCount: number;
  channel: 'whatsapp' | 'email' | 'sms' | 'both';
}

export interface CommunicationLog {
  id: string;
  gym_id: string;
  lead_id: string;
  template_id?: string | null;
  channel: 'whatsapp' | 'email' | 'sms' | 'both';
  direction: 'inbound' | 'outbound';
  status: 'Queued' | 'Sent' | 'Delivered' | 'Failed' | 'Opened' | 'Clicked';
  message_content: string;
  delivery_response?: string | null;
  created_at: string;
}

export class CommunicationService {
  /**
   * Fetch distinct conversation threads for the unified inbox
   */
  static async getThreads(gymId: string): Promise<MessageThread[]> {
    const { data: logs, error } = await supabase
      .from('automation_logs')
      .select('lead_id, channel, message_preview, created_at, leads(name, phone, email)')
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false });

    if (error || !logs) return [];

    const threadMap = new Map<string, MessageThread>();

    for (const log of logs) {
      if (!log.lead_id) continue;
      if (!threadMap.has(log.lead_id)) {
        const lead = log.leads as unknown as { name: string; phone?: string; email?: string } | null;
        threadMap.set(log.lead_id, {
          leadId: log.lead_id,
          leadName: lead?.name || 'Unknown Lead',
          leadPhone: lead?.phone,
          leadEmail: lead?.email,
          lastMessageText: log.message_preview || 'No preview available',
          lastMessageAt: log.created_at,
          unreadCount: 0,
          channel: (log.channel as MessageThread['channel']) || 'whatsapp',
        });
      }
    }

    return Array.from(threadMap.values());
  }

  /**
   * Fetch complete message history for a specific lead thread
   */
  static async getThreadHistory(gymId: string, leadId: string): Promise<CommunicationLog[]> {
    const { data, error } = await supabase
      .from('automation_logs')
      .select('*')
      .eq('gym_id', gymId)
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];

    return data.map((log) => ({
      id: log.id,
      gym_id: log.gym_id,
      lead_id: log.lead_id,
      template_id: log.template_id,
      channel: (log.channel as CommunicationLog['channel']) || 'whatsapp',
      direction: 'outbound', // Default for automation logs
      status: (log.status as CommunicationLog['status']) || 'Sent',
      message_content: log.message_preview || '',
      delivery_response: log.delivery_response,
      created_at: log.created_at,
    }));
  }

  /**
   * Send a manual outbound message from the inbox UI
   */
  static async sendMessage(gymId: string, leadId: string, channel: 'whatsapp' | 'email' | 'sms', content: string, recipient: string): Promise<void> {
    const jobType = channel === 'whatsapp' ? 'send_whatsapp' : 'send_email';
    
    // 1. Enqueue job into high_priority partition for immediate delivery
    await QueueService.enqueueJob(gymId, jobType, {
      leadId,
      [channel === 'whatsapp' ? 'phone' : 'email']: recipient,
      messageContent: content,
    }, 'high_priority');

    // 2. Log in automation_logs as Queued
    await supabase.from('automation_logs').insert({
      gym_id: gymId,
      lead_id: leadId,
      channel,
      status: 'Queued',
      message_preview: content,
    });
  }
}
