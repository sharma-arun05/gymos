// ============================================================================
// Customer Success Ticketing & NPS Module UI (/support)
// Member helpdesk tickets, trainer feedback, & Net Promoter Score (NPS).
// ============================================================================

import React, { useState } from 'react';
import { LifeBuoy, Smile, Frown, CheckCircle, Clock, Award } from 'lucide-react';
import { Button, Card, MetricCard, Badge, Avatar } from '../../components/ui';

export interface SupportTicket {
  id: string;
  memberName: string;
  email: string;
  subject: string;
  category: 'Billing' | 'Facility' | 'Trainer' | 'General';
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
}

export const SupportHub: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([
    { id: 'TICK-101', memberName: 'Rahul Sharma', email: 'rahul@example.com', subject: 'Requesting invoice change for GST filing', category: 'Billing', priority: 'high', status: 'open', createdAt: '10 mins ago' },
    { id: 'TICK-102', memberName: 'Sneha Patel', email: 'sneha@example.com', subject: 'Locker room sauna temperature adjustment', category: 'Facility', priority: 'medium', status: 'in_progress', createdAt: '2 hours ago' },
    { id: 'TICK-103', memberName: 'Vikram Guest', email: 'guest@example.com', subject: 'Question regarding VIP trial timing rescheduling', category: 'General', priority: 'low', status: 'resolved', createdAt: 'Yesterday' },
  ]);

  const [activeTab, setActiveTab] = useState<'tickets' | 'nps'>('tickets');

  const handleResolve = (id: string) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'resolved' } : t)));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" size="sm">Member Helpdesk</Badge>
            <Badge variant="success" size="sm">NPS Tracking Active</Badge>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-[#8B5CF6]" />
            Customer Success & NPS Feedback Hub
          </h1>
          <p className="text-sm text-gray-400">Resolve member inquiries, track satisfaction surveys, and maintain high retention rates.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={activeTab === 'tickets' ? 'primary' : 'secondary'} size="sm" onClick={() => setActiveTab('tickets')}>
            Helpdesk Tickets ({tickets.filter(t => t.status !== 'resolved').length})
          </Button>
          <Button variant={activeTab === 'nps' ? 'primary' : 'secondary'} size="sm" onClick={() => setActiveTab('nps')} leftIcon={<Smile className="w-4 h-4" />}>
            Net Promoter Score (NPS)
          </Button>
        </div>
      </div>

      {activeTab === 'tickets' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard title="Open Helpdesk Tickets" value={tickets.filter(t => t.status === 'open').length} change="Avg response < 15m" isPositive={true} icon={<Clock className="w-5 h-5 text-[#F59E0B]" />} subtitle="Requires attention" />
            <MetricCard title="Resolved This Week" value="28 Tickets" change="98% satisfaction" isPositive={true} icon={<CheckCircle className="w-5 h-5 text-[#22C55E]" />} subtitle="First contact resolution" />
            <MetricCard title="Avg Resolution Time" value="1.4 Hours" change="-30m vs benchmark" isPositive={true} icon={<Award className="w-5 h-5 text-[#8B5CF6]" />} subtitle="Staff efficiency" />
          </div>

          <Card variant="default" className="p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-100">Active Member Support Tickets</h3>
            <div className="divide-y divide-[#27272A]/50">
              {tickets.map((t) => (
                <div key={t.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <Avatar name={t.memberName} size="md" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#8B5CF6]">{t.id}</span>
                        <h4 className="text-sm font-bold text-white truncate">{t.subject}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                        <Badge variant="neutral" size="sm">{t.category}</Badge>
                        <span>• From: <strong className="text-gray-300">{t.memberName} ({t.email})</strong></span>
                        <span>• Created: {t.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Badge
                      variant={t.priority === 'high' ? 'error' : t.priority === 'medium' ? 'warning' : 'neutral'}
                      size="sm"
                    >
                      {t.priority.toUpperCase()} PRIORITY
                    </Badge>
                    <Badge variant={t.status === 'resolved' ? 'success' : t.status === 'in_progress' ? 'warning' : 'primary'} size="sm">
                      {t.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    {t.status !== 'resolved' && (
                      <Button variant="outline" size="sm" onClick={() => handleResolve(t.id)} className="text-xs">
                        Mark Resolved ✓
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard title="Net Promoter Score (NPS)" value="+72" change="World-class SaaS" isPositive={true} icon={<Smile className="w-5 h-5 text-[#22C55E]" />} subtitle="Promoters % - Detractors %" />
            <MetricCard title="Promoters (Score 9-10)" value="82%" change="Loyal brand advocates" isPositive={true} icon={<Smile className="w-5 h-5 text-[#22C55E]" />} subtitle="Generate member referrals" />
            <MetricCard title="Detractors (Score 0-6)" value="10%" change="Flagged for win-back" isPositive={false} icon={<Frown className="w-5 h-5 text-[#EF4444]" />} subtitle="At-risk churn candidates" />
          </div>

          <Card variant="default" className="p-6 space-y-6">
            <h3 className="text-base font-bold text-gray-100">Recent Member Feedback Survey Breakdown</h3>
            <div className="space-y-4">
              {[
                { name: 'Dr. Ramesh Kumar', score: 10, type: 'Promoter', comment: 'The new VIP equipment in Studio A and automated WhatsApp check-ins are incredible!' },
                { name: 'Pooja Verma', score: 9, type: 'Promoter', comment: 'Trainers are extremely attentive during evening personal training sessions.' },
                { name: 'Amit Singh', score: 7, type: 'Passive', comment: 'Good workout environment, but parking can be crowded on Monday evenings.' },
              ].map((fb, idx) => (
                <div key={idx} className="p-4 bg-[#111113] rounded-2xl border border-[#27272A] flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Avatar name={fb.name} size="sm" />
                      <span className="text-sm font-bold text-white">{fb.name}</span>
                      <Badge variant={fb.score >= 9 ? 'success' : 'warning'} size="sm">{fb.type} ({fb.score}/10)</Badge>
                    </div>
                    <p className="text-xs text-gray-300 pl-8 leading-relaxed">"{fb.comment}"</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
