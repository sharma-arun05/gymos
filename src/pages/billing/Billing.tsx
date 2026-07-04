// ============================================================================
// Enterprise Billing & Invoice Generation UI (/billing)
// Plan Upgrades (Starter/Growth/Pro), Usage Metering Quotas, & Tax Invoices.
// ============================================================================

import React, { useState } from 'react';
import { CreditCard, Check, Zap, Download, ShieldCheck, DollarSign, Award, AlertCircle } from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { Button, Card, Badge, ProgressBar } from '../../components/ui';

export const Billing: React.FC = () => {
  const { gymId, gymName, plan } = useGym();
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);

  const plans = [
    {
      id: 'Starter',
      name: 'Starter Tier',
      priceMonthly: 2999,
      priceAnnual: 2499,
      desc: 'Essential CRM and basic automations for boutique training studios.',
      features: ['Up to 1,000 Active Leads', '500 Automated Messages / mo', '2 Staff Roster Accounts', 'Standard Email & SMS Support'],
      recommended: false,
    },
    {
      id: 'Growth',
      name: 'Growth SaaS Plan',
      priceMonthly: 7999,
      priceAnnual: 6499,
      desc: 'Advanced WhatsApp sequences and multi-trainer trial management.',
      features: ['Up to 10,000 Active Leads', '5,000 WhatsApp & Email / mo', '10 Staff Roster Accounts', 'Visual Workflow Builder', 'Algorithmic Lead Scoring (0-100)'],
      recommended: true,
    },
    {
      id: 'Pro',
      name: 'Enterprise Pro',
      priceMonthly: 14999,
      priceAnnual: 11999,
      desc: 'Unlimited power, custom AI models, and dedicated data warehouse ETL.',
      features: ['Unlimited Active Leads', 'Unlimited WhatsApp & Email', 'Unlimited Staff Roster', 'Dedicated Star Schema ETL', 'AI Conversion Probability Engine', '24/7 Dedicated Account Manager'],
      recommended: false,
    },
  ];

  const invoices = [
    { id: 'INV-2026-06', date: '01 Jun 2026', amount: '₹7,668 (inc GST)', status: 'Paid', pdfUrl: '#' },
    { id: 'INV-2026-05', date: '01 May 2026', amount: '₹7,668 (inc GST)', status: 'Paid', pdfUrl: '#' },
    { id: 'INV-2026-04', date: '01 Apr 2026', amount: '₹7,668 (inc GST)', status: 'Paid', pdfUrl: '#' },
  ];

  const handleUpgrade = (targetPlan: string) => {
    setUpgradingPlan(targetPlan);
    setTimeout(() => {
      alert(`🎉 Successfully switched to ${targetPlan} Plan via Razorpay checkout! Your billing cycle has been updated.`);
      setUpgradingPlan(null);
    }, 1500);
  };

  const handleDownloadInvoice = (invId: string) => {
    alert(`Downloading Tax Invoice [${invId}] with GST breakdown (18% IGST)...`);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" size="sm">Current Tier: {plan}</Badge>
            <Badge variant="success" size="sm">Razorpay Enterprise Billing</Badge>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#8B5CF6]" />
            Subscription & Enterprise Billing
          </h1>
          <p className="text-sm text-gray-400">Manage your GymOS subscription tier, monitor quota consumption, and download tax invoices.</p>
        </div>
      </div>

      {/* Quota Consumption Card */}
      <Card variant="default" className="p-6 space-y-4 bg-gradient-to-r from-[#18181B] via-[#111113] to-[#18181B]">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#F59E0B]" />
            Current Monthly Quota Consumption ({plan} Plan)
          </h3>
          <span className="text-xs text-gray-400">Resets in 26 days</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-gray-300">
              <span>Active CRM Leads</span>
              <span>1,248 / 10,000 (12%)</span>
            </div>
            <ProgressBar value={12} max={100} variant="primary" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-gray-300">
              <span>WhatsApp Messages</span>
              <span>3,410 / 5,000 (68%)</span>
            </div>
            <ProgressBar value={68} max={100} variant="warning" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-gray-300">
              <span>Staff Roster Accounts</span>
              <span>4 / 10 (40%)</span>
            </div>
            <ProgressBar value={40} max={100} variant="success" />
          </div>
        </div>
      </Card>

      {/* Billing Cycle Selector */}
      <div className="flex justify-center">
        <div className="bg-[#18181B] p-1.5 rounded-2xl border border-[#27272A] inline-flex items-center gap-1 shadow-lg">
          <button
            onClick={() => setSelectedBillingCycle('monthly')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedBillingCycle === 'monthly' ? 'bg-[#8B5CF6] text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setSelectedBillingCycle('annual')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedBillingCycle === 'annual' ? 'bg-[#8B5CF6] text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Annual Billing <span className="bg-[#22C55E] text-black text-[10px] font-black px-1.5 py-0.5 rounded-full">SAVE 20%</span>
          </button>
        </div>
      </div>

      {/* Subscription Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isCurrent = plan === p.id;
          const price = selectedBillingCycle === 'annual' ? p.priceAnnual : p.priceMonthly;
          return (
            <Card
              key={p.id}
              variant="default"
              className={`p-6 flex flex-col justify-between space-y-6 transition-all relative ${
                p.recommended ? 'border-2 border-[#8B5CF6] shadow-2xl bg-gradient-to-b from-[#18181B] to-[#111113]' : 'bg-[#111113]'
              }`}
            >
              {p.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#8B5CF6] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                  Most Popular for SaaS
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-black text-white">{p.name}</h3>
                  <p className="text-xs text-gray-400 mt-1 h-8">{p.desc}</p>
                </div>

                <div className="py-4 border-y border-[#27272A]">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">₹{price.toLocaleString()}</span>
                    <span className="text-xs text-gray-400">/ month ({selectedBillingCycle})</span>
                  </div>
                  <span className="text-[10px] text-gray-500 block mt-0.5">Billed {selectedBillingCycle === 'annual' ? `₹${(price * 12).toLocaleString()} annually` : 'monthly'}</span>
                </div>

                <ul className="space-y-2.5 text-xs text-gray-300">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#22C55E] shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4">
                {isCurrent ? (
                  <Button variant="outline" size="md" className="w-full text-xs" disabled>
                    ✓ Active Current Tier
                  </Button>
                ) : (
                  <Button
                    variant={p.recommended ? 'primary' : 'secondary'}
                    size="md"
                    className="w-full text-xs"
                    onClick={() => handleUpgrade(p.id)}
                    isLoading={upgradingPlan === p.id}
                  >
                    Switch to {p.id} Plan →
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Payment Methods & Invoice History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Payment Method (5 Cols) */}
        <Card variant="default" className="lg:col-span-5 p-6 space-y-4">
          <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
            Saved Payment Methods
          </h3>
          <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-6 bg-[#111113] rounded border border-[#27272A] flex items-center justify-center font-black text-xs text-white">
                VISA
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Visa ending in •••• 4242</span>
                <span className="text-[10px] text-gray-500">Expires 08/2028 • Default Payment</span>
              </div>
            </div>
            <Badge variant="success" size="sm">Active</Badge>
          </div>
          <Button variant="outline" size="sm" className="w-full text-xs">
            + Add New UPI / Credit Card via Razorpay
          </Button>
        </Card>

        {/* Right: Tax Invoice History (7 Cols) */}
        <Card variant="default" className="lg:col-span-7 p-6 space-y-4">
          <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
            <Download className="w-4 h-4 text-[#8B5CF6]" />
            GST Tax Invoice History
          </h3>
          <div className="divide-y divide-[#27272A]/50">
            {invoices.map((inv) => (
              <div key={inv.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-white block">{inv.id}</span>
                  <span className="text-xs text-gray-400">{inv.date} • {inv.amount}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="success" size="sm">{inv.status}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => handleDownloadInvoice(inv.id)} className="text-xs">
                    Download PDF ↓
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </div>
  );
};
