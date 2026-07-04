// ============================================================================
// SuperAdmin God Mode Portal UI (/admin)
// Multi-tenant telemetry: Aggregate ARR, MRR, DAU/MAU, Tenant Roster.
// ============================================================================

import React, { useState } from 'react';
import { Shield, TrendingUp, DollarSign, Users, Activity, Building, Award, CheckCircle, ExternalLink, Lock } from 'lucide-react';
import { Button, Card, MetricCard, Badge, Avatar, Input, Select, ProgressBar } from '../../components/ui';

export interface GymTenant {
  id: string;
  name: string;
  ownerName: string;
  plan: 'Starter' | 'Growth' | 'Pro';
  mrr: number;
  leadsCount: number;
  automationsCount: number;
  status: 'Active' | 'Trial' | 'Delinquent';
}

export const SuperAdminPortal: React.FC = () => {
  const [tenants, setTenants] = useState<GymTenant[]>([
    { id: 'gym-001', name: 'Way Ahead Fitness Studio', ownerName: 'Arun Kumar', plan: 'Pro', mrr: 14999, leadsCount: 1248, automationsCount: 3410, status: 'Active' },
    { id: 'gym-002', name: 'Iron & Grit Crossfit', ownerName: 'Rakesh Roshan', plan: 'Growth', mrr: 7999, leadsCount: 680, automationsCount: 1890, status: 'Active' },
    { id: 'gym-003', name: 'Zenith Yoga & Wellness', ownerName: 'Priya Verma', plan: 'Starter', mrr: 2999, leadsCount: 310, automationsCount: 420, status: 'Active' },
    { id: 'gym-004', name: 'Spartan Athletics Club', ownerName: 'Vikramaditya', plan: 'Pro', mrr: 14999, leadsCount: 2410, automationsCount: 6800, status: 'Active' },
    { id: 'gym-005', name: 'Flex Gym Boutique', ownerName: 'Siddharth M.', plan: 'Growth', mrr: 7999, leadsCount: 540, automationsCount: 910, status: 'Trial' },
  ]);

  const [searchQuery, setSearchQuery] = useState<string>('');

  const totalMrr = tenants.reduce((sum, t) => sum + t.mrr, 0);
  const totalArr = totalMrr * 12;

  const handleImpersonate = (tenant: GymTenant) => {
    alert(`🔐 GOD MODE IMPERSONATION: Switching tenant context to [${tenant.name}] (ID: ${tenant.id}). All RLS tokens overridden.`);
  };

  const filteredTenants = tenants.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.ownerName.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="error" size="sm" className="gap-1 font-black">
              <Lock className="w-3 h-3" />
              GOD MODE SUPERADMIN
            </Badge>
            <Badge variant="success" size="sm">Multi-Tenant Platform Telemetry</Badge>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#EF4444]" />
            Platform SuperAdmin Dashboard
          </h1>
          <p className="text-sm text-gray-400">Executive oversight across all active gym tenants, aggregate ARR telemetry, and tenant impersonation.</p>
        </div>
      </div>

      {/* Platform Macro KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <MetricCard title="Aggregate Platform ARR" value={`₹${(totalArr / 100000).toFixed(2)} Lakhs`} change="+28.4% MoM platform growth" isPositive={true} icon={<DollarSign className="w-5 h-5 text-[#22C55E]" />} subtitle="Combined annualized revenue" />
        <MetricCard title="Total Active Tenants" value="142 Gyms" change="96% trial-to-paid conversion" isPositive={true} icon={<Building className="w-5 h-5 text-[#8B5CF6]" />} subtitle="Across India & SEA" />
        <MetricCard title="Platform DAU / MAU Ratio" value="84.2%" change="World-class daily engagement" isPositive={true} icon={<Activity className="w-5 h-5 text-[#F59E0B]" />} subtitle="Daily active gym owners" />
        <MetricCard title="Platform Net Churn" value="0.8%" change="Negative churn via expansions" isPositive={true} icon={<Award className="w-5 h-5 text-[#3B82F6]" />} subtitle="Industry best benchmark" />
      </div>

      {/* Tenant Roster Grid */}
      <Card variant="default" className="p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#27272A] pb-4 gap-4">
          <div className="w-full max-w-sm">
            <Input
              placeholder="Search gym brand or owner name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <span className="text-xs text-gray-400 font-mono">Showing {filteredTenants.length} of 142 total tenants</span>
        </div>

        <div className="divide-y divide-[#27272A]/50">
          {filteredTenants.map((t) => (
            <div key={t.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#111113] border border-[#27272A] flex items-center justify-center shrink-0 font-black text-xs text-[#8B5CF6]">
                  GYM
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white truncate">{t.name}</h4>
                    <Badge variant={t.plan === 'Pro' ? 'primary' : t.plan === 'Growth' ? 'warning' : 'neutral'} size="sm">
                      {t.plan} Tier
                    </Badge>
                    <Badge variant={t.status === 'Active' ? 'success' : 'warning'} size="sm">{t.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span>Owner: <strong className="text-gray-300">{t.ownerName}</strong></span>
                    <span>• Leads: <strong className="text-gray-300">{t.leadsCount.toLocaleString()}</strong></span>
                    <span>• Automations: <strong className="text-gray-300">{t.automationsCount.toLocaleString()} / mo</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <span className="text-sm font-black text-[#22C55E]">₹{t.mrr.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-500 block">/ mo MRR contribution</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleImpersonate(t)}
                  className="text-xs border-[#EF4444]/40 text-[#EF4444] hover:bg-[#EF4444]/10"
                >
                  Impersonate Tenant →
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
