// ============================================================================
// Enterprise Integration Marketplace UI (/integrations)
// 12+ pre-built connectors: Meta WhatsApp, Resend, Razorpay, Stripe, Zapier, Make.
// ============================================================================

import React, { useState } from 'react';
import { Plug, ExternalLink, ShieldCheck } from 'lucide-react';
import { Button, Card, Badge } from '../../components/ui';

export interface IntegrationApp {
  id: string;
  name: string;
  category: 'Messaging' | 'Billing' | 'Automation' | 'Productivity';
  desc: string;
  icon: string;
  status: 'Connected' | 'Available' | 'Beta';
  docsUrl: string;
}

export const Marketplace: React.FC = () => {
  const [apps, setApps] = useState<IntegrationApp[]>([
    { id: 'meta_whatsapp', name: 'Meta Cloud WhatsApp', category: 'Messaging', desc: 'Official API for automated lead sequences and trial notifications.', icon: '💬', status: 'Connected', docsUrl: '#' },
    { id: 'resend_email', name: 'Resend Email Engine', category: 'Messaging', desc: 'High-deliverability transactional emails and welcome series.', icon: '✉️', status: 'Connected', docsUrl: '#' },
    { id: 'razorpay', name: 'Razorpay Billing', category: 'Billing', desc: 'UPI, credit card recurring subscriptions, and GST tax invoices.', icon: '₹', status: 'Connected', docsUrl: '#' },
    { id: 'stripe', name: 'Stripe Global Payments', category: 'Billing', desc: 'International currency processing and card vaults.', icon: '💳', status: 'Available', docsUrl: '#' },
    { id: 'zapier', name: 'Zapier Automation', category: 'Automation', desc: 'Connect GymOS to 5,000+ third-party apps and CRM spreadsheets.', icon: '⚡', status: 'Available', docsUrl: '#' },
    { id: 'make', name: 'Make.com Workflows', category: 'Automation', desc: 'Visual multi-step automation pipelines and data transformations.', icon: '⚙️', status: 'Available', docsUrl: '#' },
    { id: 'gcal', name: 'Google Calendar Sync', category: 'Productivity', desc: 'Two-way trainer schedule sync for VIP trial appointments.', icon: '📅', status: 'Connected', docsUrl: '#' },
    { id: 'zoom', name: 'Zoom Virtual Fitness', category: 'Productivity', desc: 'Auto-generate streaming links for online personal training.', icon: '📹', status: 'Available', docsUrl: '#' },
    { id: 'twilio', name: 'Twilio SMS Gateway', category: 'Messaging', desc: 'Local DLT-compliant SMS broadcasts and verification OTPs.', icon: '📱', status: 'Available', docsUrl: '#' },
    { id: 'slack', name: 'Slack Staff Alerts', category: 'Productivity', desc: 'Push real-time hot lead notifications to your team channel.', icon: '💬', status: 'Available', docsUrl: '#' },
    { id: 'openai', name: 'OpenAI GPT-4o Engine', category: 'Automation', desc: 'Custom AI followup drafting and conversion probability scoring.', icon: '🤖', status: 'Connected', docsUrl: '#' },
    { id: 'webhooks', name: 'Custom Webhooks', category: 'Automation', desc: 'Stream real-time EventBus telemetry to external endpoints.', icon: '🔗', status: 'Available', docsUrl: '#' },
  ]);

  const [filterCat, setFilterCat] = useState<string>('ALL');
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const handleToggleConnect = (id: string) => {
    setConnectingId(id);
    setTimeout(() => {
      setApps((prev) =>
        prev.map((app) =>
          app.id === id ? { ...app, status: app.status === 'Connected' ? 'Available' : 'Connected' } : app
        )
      );
      setConnectingId(null);
    }, 1000);
  };

  const filteredApps = apps.filter((a) => filterCat === 'ALL' || a.category === filterCat);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" size="sm">12+ Enterprise Connectors</Badge>
            <Badge variant="success" size="sm" className="gap-1">
              <ShieldCheck className="w-3 h-3" />
              OAuth 2.0 Audited
            </Badge>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Plug className="w-6 h-6 text-[#8B5CF6]" />
            Integration Marketplace & App Ecosystem
          </h1>
          <p className="text-sm text-gray-400">Connect GymOS with your favorite communication channels, payment gateways, and automation pipelines.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-[#27272A] pb-3 overflow-x-auto no-scrollbar">
        {['ALL', 'Messaging', 'Billing', 'Automation', 'Productivity'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filterCat === cat
                ? 'bg-[#8B5CF6] text-white shadow-md'
                : 'bg-[#18181B] text-gray-400 hover:text-gray-200 border border-[#27272A]'
            }`}
          >
            {cat === 'ALL' ? 'All Integrations (12)' : cat}
          </button>
        ))}
      </div>

      {/* Apps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredApps.map((app) => {
          const isConnected = app.status === 'Connected';
          return (
            <Card
              key={app.id}
              variant="default"
              className={`p-6 flex flex-col justify-between space-y-5 transition-all ${
                isConnected ? 'border-l-4 border-[#22C55E] bg-gradient-to-br from-[#18181B] to-[#111113]' : 'bg-[#111113]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2 bg-[#18181B] rounded-xl border border-[#27272A] shadow-md block">
                      {app.icon}
                    </span>
                    <div>
                      <h3 className="text-base font-black text-white">{app.name}</h3>
                      <Badge variant="neutral" size="sm">{app.category}</Badge>
                    </div>
                  </div>
                  {isConnected ? (
                    <Badge variant="success" size="sm" className="shrink-0">✓ Connected</Badge>
                  ) : (
                    <Badge variant="neutral" size="sm" className="shrink-0">Available</Badge>
                  )}
                </div>

                <p className="text-xs text-gray-400 leading-relaxed min-h-[36px]">{app.desc}</p>
              </div>

              <div className="pt-3 border-t border-[#27272A] flex items-center justify-between">
                <a href={app.docsUrl} className="text-[11px] font-semibold text-[#8B5CF6] hover:underline flex items-center gap-1">
                  Documentation <ExternalLink className="w-3 h-3" />
                </a>
                <Button
                  variant={isConnected ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => handleToggleConnect(app.id)}
                  isLoading={connectingId === app.id}
                  className="text-xs py-1.5 px-3"
                >
                  {isConnected ? 'Disconnect' : 'Connect App →'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
