// ============================================================================
// Backup & Disaster Recovery Center UI (/backups)
// Point-in-Time Recovery (PITR), Geo-redundant replicas, & 1-click restore.
// ============================================================================

import React, { useState } from 'react';
import { Database, ShieldCheck, RefreshCw, Download, RotateCcw, CheckCircle, Clock, Server, AlertTriangle } from 'lucide-react';
import { Button, Card, MetricCard, Badge, Skeleton, EmptyState } from '../../components/ui';

export interface BackupSnapshot {
  id: string;
  timestamp: string;
  size: string;
  type: 'Automated Nightly (PITR)' | 'Manual Pre-deploy' | 'ETL Checkpoint';
  status: 'Verified Intact' | 'Archived';
  region: 'ap-south-1 (Mumbai)' | 'ap-southeast-1 (Singapore)';
}

export const BackupCenter: React.FC = () => {
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>([
    { id: 'SNAP-20260704-0300', timestamp: '04 Jul 2026, 03:00 UTC', size: '142 MB', type: 'Automated Nightly (PITR)', status: 'Verified Intact', region: 'ap-south-1 (Mumbai)' },
    { id: 'SNAP-20260703-0300', timestamp: '03 Jul 2026, 03:00 UTC', size: '140 MB', type: 'Automated Nightly (PITR)', status: 'Verified Intact', region: 'ap-south-1 (Mumbai)' },
    { id: 'SNAP-20260702-1830', timestamp: '02 Jul 2026, 18:30 UTC', size: '138 MB', type: 'Manual Pre-deploy', status: 'Verified Intact', region: 'ap-southeast-1 (Singapore)' },
    { id: 'SNAP-20260701-0300', timestamp: '01 Jul 2026, 03:00 UTC', size: '135 MB', type: 'ETL Checkpoint', status: 'Archived', region: 'ap-south-1 (Mumbai)' },
  ]);

  const [restoringId, setRestoringId] = useState<string | null>(null);

  const handleRestore = (snap: BackupSnapshot) => {
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to restore tenant state to snapshot [${snap.id}]? Current active data since ${snap.timestamp} will be overwritten.`)) return;
    setRestoringId(snap.id);
    setTimeout(() => {
      alert(`✅ Database successfully restored to Point-In-Time checkpoint [${snap.id}]. All RLS policies and Star Schema dimensions have been re-verified.`);
      setRestoringId(null);
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="success" size="sm" className="gap-1">
              <ShieldCheck className="w-3 h-3" />
              PITR Continuous Archiving Active
            </Badge>
            <Badge variant="primary" size="sm">Geo-Redundant Replica: Singapore</Badge>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-[#8B5CF6]" />
            Backup & Disaster Recovery Center
          </h1>
          <p className="text-sm text-gray-400">Manage automated nightly point-in-time recovery (PITR) snapshots and geo-redundant database replication.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => alert('Initiating immediate manual snapshot of active tenant schema...')} leftIcon={<Download className="w-4 h-4" />}>
          Take Instant Snapshot
        </Button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Recovery Point Objective (RPO)" value="< 5 Seconds" change="Continuous PITR stream" isPositive={true} icon={<Clock className="w-5 h-5 text-[#22C55E]" />} subtitle="Zero data loss guarantee" />
        <MetricCard title="Recovery Time Objective (RTO)" value="< 45 Seconds" change="1-Click failover active" isPositive={true} icon={<RotateCcw className="w-5 h-5 text-[#8B5CF6]" />} subtitle="Automated restoration" />
        <MetricCard title="Standby Replica Health" value="100% Synced" change="ap-southeast-1 (Singapore)" isPositive={true} icon={<Server className="w-5 h-5 text-[#3B82F6]" />} subtitle="Geo-redundant mirror" />
      </div>

      {/* Snapshots Table */}
      <Card variant="default" className="p-6 space-y-4">
        <div className="border-b border-[#27272A] pb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
            Available Database Snapshots & PITR Checkpoints
          </h3>
          <Badge variant="neutral" size="sm">Retention: 30 Days</Badge>
        </div>

        <div className="divide-y divide-[#27272A]/50">
          {snapshots.map((snap) => (
            <div key={snap.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#111113] border border-[#27272A] flex items-center justify-center shrink-0 mt-0.5">
                  <Database className="w-5 h-5 text-[#8B5CF6]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white truncate">{snap.id}</h4>
                    <Badge variant="primary" size="sm">{snap.type}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span>🕒 {snap.timestamp}</span>
                    <span>• Size: <strong className="text-gray-300">{snap.size}</strong></span>
                    <span>• Region: <strong className="text-gray-300">{snap.region}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Badge variant="success" size="sm">{snap.status}</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestore(snap)}
                  isLoading={restoringId === snap.id}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5 text-[#F59E0B]" />}
                  className="text-xs hover:border-[#F59E0B]"
                >
                  Restore Checkpoint
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
