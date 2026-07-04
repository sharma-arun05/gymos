// ============================================================================
// Executive Dashboard 2.0 UI (/dashboard)
// Real-time KPIs, Funnel Velocity Chart, Today's Action Center, & Quick CTAs.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, TrendingUp, Calendar, DollarSign, Zap, Sparkles, 
  Plus, ArrowRight, CheckCircle, PhoneCall, Clock, ShieldCheck, Activity 
} from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { DashboardService, DashboardKPIs, FunnelStage, TodayActionItem } from '../../domains/business/analytics';
import { Button, Card, MetricCard, Badge, ProgressBar, Skeleton, EmptyState } from '../../components/ui';

export const Dashboard: React.FC = () => {
  const { gymId, gymName, plan } = useGym();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [actions, setActions] = useState<TodayActionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (gymId) loadDashboardData();
  }, [gymId]);

  const loadDashboardData = async () => {
    setLoading(true);
    const gId = gymId || 'demo-gym';
    try {
      const [kpiData, funnelData, actionsData] = await Promise.all([
        DashboardService.getKPIs(gId),
        DashboardService.getFunnel(gId),
        DashboardService.getTodayActions(gId),
      ]);
      setKpis(kpiData);
      setFunnel(funnelData);
      setActions(actionsData);
    } catch (err) {
      console.error('Failed to load dashboard analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    alert(`Quick Action Triggered: ${action}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#18181B] via-[#111113] to-[#18181B] p-6 rounded-2xl border border-[#27272A] shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" size="sm">{plan} Plan</Badge>
            <Badge variant="success" size="sm" className="gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              Live Star Schema ETL
            </Badge>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] to-[#C084FC]">{gymName}</span>
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Here is your real-time executive performance and action center for today.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="primary" size="sm" onClick={() => handleQuickAction('Add Lead')} leftIcon={<Plus className="w-4 h-4" />}>
            New Lead
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleQuickAction('Book Trial')} leftIcon={<Calendar className="w-4 h-4 text-[#22C55E]" />}>
            Book Trial
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleQuickAction('AI Report')} leftIcon={<Sparkles className="w-4 h-4 text-[#8B5CF6]" />}>
            AI Report
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading || !kpis ? (
          <>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </>
        ) : (
          <>
            <MetricCard
              title="Total Active Leads"
              value={kpis.totalLeads.toLocaleString()}
              change={`+${kpis.newLeadsToday} today`}
              isPositive={true}
              icon={<Users className="w-5 h-5" />}
              subtitle="Funnel Intake"
            />
            <MetricCard
              title="Conversion Rate"
              value={`${kpis.conversionRate}%`}
              change="+2.4% vs last mo"
              isPositive={true}
              icon={<TrendingUp className="w-5 h-5" />}
              subtitle="Lead-to-Member"
            />
            <MetricCard
              title="Trial Show Rate"
              value={`${kpis.trialShowRate}%`}
              change="74% industry avg"
              isPositive={kpis.trialShowRate >= 70}
              icon={<Calendar className="w-5 h-5" />}
              subtitle="Attendance Flag"
            />
            <MetricCard
              title="Monthly ARR / Revenue"
              value={`₹${(kpis.monthlyRevenue / 1000).toFixed(1)}k`}
              change="+14.2% MoM"
              isPositive={true}
              icon={<DollarSign className="w-5 h-5" />}
              subtitle="Recurring Subscription"
            />
          </>
        )}
      </div>

      {/* Two-Column Analytics & Action Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Funnel Velocity Chart (7 Cols) */}
        <Card variant="default" className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#8B5CF6]" />
                Pipeline Funnel Velocity
              </h3>
              <p className="text-xs text-gray-400">Visual drop-off progression from initial lead capture to membership conversion.</p>
            </div>
            <Badge variant="neutral" size="sm">Last 30 Days</Badge>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              funnel.map((stage, idx) => (
                <div key={stage.stage} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-300">
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-[#111113] border border-[#27272A] inline-flex items-center justify-center text-[10px] text-[#8B5CF6]">
                        {idx + 1}
                      </span>
                      {stage.stage}
                    </span>
                    <span className="text-gray-400 font-medium">
                      {stage.count.toLocaleString()} leads (<span className="text-white font-bold">{stage.percentage}%</span>)
                    </span>
                  </div>
                  <ProgressBar
                    value={stage.percentage}
                    max={100}
                    variant={idx === 4 ? 'success' : idx === 0 ? 'primary' : 'warning'}
                  />
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-[#27272A]/50 flex items-center justify-between text-xs text-gray-500">
            <span>Average Time-to-Convert: <strong className="text-gray-300">4.2 days</strong></span>
            <span>Algorithmic Lead Score: <strong className="text-[#8B5CF6]">68/100 Avg</strong></span>
          </div>
        </Card>

        {/* Right Column: Today's Action Center (5 Cols) */}
        <Card variant="default" className="lg:col-span-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#F59E0B]" />
                Today's Action Center
              </h3>
              <p className="text-xs text-gray-400">Urgent tasks and VIP trial appointments requiring staff attention.</p>
            </div>
            <Badge variant="warning" size="sm">{actions.length} Pending</Badge>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : actions.length === 0 ? (
              <EmptyState title="All Caught Up!" description="You have no pending urgent actions or trial appointments for today." />
            ) : (
              actions.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-[#111113] border border-[#27272A] hover:border-[#8B5CF6]/50 transition-all flex items-start justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#18181B] border border-[#27272A] flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      {item.type === 'trial' && <Calendar className="w-4 h-4 text-[#22C55E]" />}
                      {item.type === 'hot_lead' && <PhoneCall className="w-4 h-4 text-[#EF4444]" />}
                      {item.type === 'task' && <Clock className="w-4 h-4 text-[#F59E0B]" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-100 truncate">{item.title}</h4>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{item.subtitle}</p>
                      {item.time && (
                        <span className="text-[10px] font-semibold text-[#8B5CF6] mt-1 inline-block bg-[#8B5CF6]/10 px-2 py-0.5 rounded border border-[#8B5CF6]/20">
                          Due: {item.time}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleQuickAction(item.title)} className="shrink-0 text-xs py-1 px-2.5">
                    {item.type === 'hot_lead' ? 'Call Now' : 'Complete'}
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

      </div>
    </div>
  );
};
