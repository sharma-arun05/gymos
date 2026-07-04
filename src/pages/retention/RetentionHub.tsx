// ============================================================================
// Customer Retention Engine UI (/retention)
// Automated expiry alerts, churn risk scoring, & WhatsApp win-back workflows.
// ============================================================================

import React, { useState } from 'react';
import { HeartPulse, AlertTriangle, Send, ShieldAlert, Award } from 'lucide-react';
import { Button, Card, MetricCard, Badge, Avatar, ProgressBar } from '../../components/ui';

export interface AtRiskMember {
  id: string;
  name: string;
  phone: string;
  plan: string;
  daysInactive: number;
  expiryDays: number; // Negative means already expired
  churnRiskPercent: number;
  lastVisit: string;
}

export const RetentionHub: React.FC = () => {
  const [members] = useState<AtRiskMember[]>([
    { id: '1', name: 'Amit Kumar', phone: '+91 98111 22233', plan: 'Pro Quarterly', daysInactive: 16, expiryDays: 3, churnRiskPercent: 88, lastVisit: '16 Jun 2026' },
    { id: '2', name: 'Riya Sharma', phone: '+91 98222 33344', plan: 'Growth Annual', daysInactive: 21, expiryDays: 14, churnRiskPercent: 74, lastVisit: '11 Jun 2026' },
    { id: '3', name: 'Karan Mehta', phone: '+91 98333 44455', plan: 'Starter Monthly', daysInactive: 8, expiryDays: 1, churnRiskPercent: 62, lastVisit: '24 Jun 2026' },
    { id: '4', name: 'Neha Gupta', phone: '+91 98444 55566', plan: 'Pro Annual', daysInactive: 28, expiryDays: -2, churnRiskPercent: 95, lastVisit: '04 Jun 2026' },
  ]);

  const [triggering, setTriggering] = useState<string | null>(null);

  const handleWinBack = (member: AtRiskMember) => {
    setTriggering(member.id);
    setTimeout(() => {
      alert(`🚀 Automated WhatsApp Win-Back Script dispatched to ${member.name} (${member.phone}) with a complimentary PT session voucher!`);
      setTriggering(null);
    }, 1200);
  };

  const handleBulkWinBack = () => {
    alert('⚡ Bulk Win-Back Campaign triggered for all 4 at-risk members! 4 background jobs enqueued to normal_priority partition.');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="warning" size="sm">Churn Defense Engine</Badge>
            <Badge variant="primary" size="sm">Algorithmic Risk Scoring</Badge>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-[#EF4444]" />
            Customer Retention & Win-Back Hub
          </h1>
          <p className="text-sm text-gray-400">Identify at-risk members before they churn and trigger automated WhatsApp renewal workflows.</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleBulkWinBack} leftIcon={<Send className="w-4 h-4" />}>
          Trigger Bulk Win-Back Campaign
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Monthly Churn Rate" value="2.1%" change="-0.8% below avg" isPositive={true} icon={<HeartPulse className="w-5 h-5 text-[#22C55E]" />} subtitle="Active Subscription Retention" />
        <MetricCard title="At-Risk Members Flagged" value={members.length} change="Requires immediate outreach" isPositive={false} icon={<AlertTriangle className="w-5 h-5 text-[#F59E0B]" />} subtitle="Inactive > 14 days or Expiring" />
        <MetricCard title="Win-Back Revenue Saved" value="₹1.42 Lakhs" change="+₹42k this quarter" isPositive={true} icon={<Award className="w-5 h-5 text-[#8B5CF6]" />} subtitle="From Automated Reminders" />
      </div>

      {/* At-Risk Roster Table */}
      <Card variant="default" className="p-6 space-y-4">
        <div className="border-b border-[#27272A] pb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
            At-Risk Member Roster & Renewal Schedule
          </h3>
          <Badge variant="error" size="sm">High Churn Probability</Badge>
        </div>

        <div className="divide-y divide-[#27272A]/50">
          {members.map((m) => (
            <div key={m.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <Avatar name={m.name} size="md" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white truncate">{m.name}</h4>
                    <Badge variant="primary" size="sm">{m.plan}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span>📞 {m.phone}</span>
                    <span>• Last Studio Visit: <strong className="text-gray-300">{m.lastVisit} ({m.daysInactive}d ago)</strong></span>
                  </div>
                </div>
              </div>

              {/* Churn Risk Bar & Action */}
              <div className="flex items-center gap-6 shrink-0">
                <div className="w-36 space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-400">Churn Risk:</span>
                    <span className={m.churnRiskPercent >= 80 ? 'text-[#EF4444]' : 'text-[#F59E0B]'}>{m.churnRiskPercent}%</span>
                  </div>
                  <ProgressBar value={m.churnRiskPercent} max={100} variant={m.churnRiskPercent >= 80 ? 'error' : 'warning'} />
                  <span className="text-[10px] text-gray-500 block">
                    {m.expiryDays < 0 ? `⚠️ Expired ${Math.abs(m.expiryDays)}d ago` : `Expires in ${m.expiryDays} days`}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleWinBack(m)}
                  isLoading={triggering === m.id}
                  leftIcon={<Send className="w-3.5 h-3.5 text-[#22C55E]" />}
                  className="text-xs"
                >
                  Send Win-Back WhatsApp
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
