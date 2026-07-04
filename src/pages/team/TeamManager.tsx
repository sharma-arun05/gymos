// ============================================================================
// Team Management Portal & RBAC Matrix UI (/team)
// Staff invites, Role assignments, & Permission matrix verification.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Shield, UserPlus, Check, X } from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { TeamRepository, PERMISSION_MATRIX } from '../../domains/gym-core/auth';
import type { StaffMember, UserRole, Permission } from '../../domains/gym-core/auth';
import { Button, Card, Badge, Avatar, Skeleton, Input, Select } from '../../components/ui';

export const TeamManager: React.FC = () => {
  const { gymId } = useGym();
  const [team, setTeam] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'roster' | 'matrix'>('roster');
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteName, setInviteName] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<UserRole>('trainer');
  const [inviting, setInviting] = useState<boolean>(false);

  useEffect(() => {
    loadTeam();
  }, [gymId]);

  const loadTeam = async () => {
    setLoading(true);
    try {
      const data = await TeamRepository.getTeamMembers(gymId || 'demo-gym');
      if (data && data.length > 0) {
        setTeam(data);
      } else {
        setTeam([
          { id: '1', name: 'Arun Kumar', email: 'arun@gymos.app', role: 'owner', gym_id: gymId || 'demo-gym', created_at: new Date().toISOString() },
          { id: '2', name: 'Vikram Singh', email: 'vikram@gymos.app', role: 'trainer', gym_id: gymId || 'demo-gym', created_at: new Date().toISOString() },
          { id: '3', name: 'Ananya Rao', email: 'ananya@gymos.app', role: 'manager', gym_id: gymId || 'demo-gym', created_at: new Date().toISOString() },
          { id: '4', name: 'Rohan Desk', email: 'rohan@gymos.app', role: 'frontdesk', gym_id: gymId || 'demo-gym', created_at: new Date().toISOString() },
        ]);
      }
    } catch (err) {
      console.error('Failed to load team:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName || !gymId) return;
    setInviting(true);
    try {
      const newStaff = await TeamRepository.inviteMember(gymId, inviteEmail, inviteName, inviteRole);
      setTeam([...team, newStaff]);
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteName('');
    } catch (err) {
      console.error('Failed to invite member:', err);
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setTeam((prev) => prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m)));
    try {
      await TeamRepository.updateRole(userId, gymId || 'demo-gym', newRole);
    } catch (err) {
      console.error('Failed to persist role update:', err);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'owner': return <Badge variant="primary" size="sm">👑 Owner</Badge>;
      case 'manager': return <Badge variant="warning" size="sm">⚡ Manager</Badge>;
      case 'trainer': return <Badge variant="info" size="sm">💪 Trainer</Badge>;
      case 'frontdesk': return <Badge variant="neutral" size="sm">🖥️ Front Desk</Badge>;
    }
  };

  const allPerms: { label: string; key: Permission }[] = [
    { label: 'View Leads CRM & Pipeline', key: 'leads.view' },
    { label: 'Create & Ingest Leads', key: 'leads.create' },
    { label: 'Delete & Export Lead Records', key: 'leads.delete' },
    { label: 'View & Check-In VIP Trials', key: 'trials.view' },
    { label: 'Configure Automated Workflows', key: 'automations.edit' },
    { label: 'View Revenue & Billing Invoices', key: 'billing.view' },
    { label: 'Manage Stripe/Razorpay Billing', key: 'billing.manage' },
    { label: 'Invite Staff & Edit Roles', key: 'team.manage' },
    { label: 'Access Executive Data Warehouse', key: 'analytics.view' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#8B5CF6]" />
            Team RBAC & Permission Roster
          </h1>
          <p className="text-sm text-gray-400">Manage gym staff, assign granular roles, and enforce enterprise permission policies.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'roster' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('roster')}
          >
            Staff Roster ({team.length})
          </Button>
          <Button
            variant={activeTab === 'matrix' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('matrix')}
            leftIcon={<Shield className="w-4 h-4" />}
          >
            Permission Matrix
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowInviteModal(true)} leftIcon={<UserPlus className="w-4 h-4 text-[#8B5CF6]" />}>
            Invite Staff
          </Button>
        </div>
      </div>

      {activeTab === 'roster' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <>
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </>
          ) : (
            team.map((member) => (
              <Card key={member.id} variant="default" className="p-5 space-y-4 flex flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={member.name} size="md" />
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-white truncate">{member.name}</h3>
                      <span className="text-xs text-gray-400 truncate block">{member.email}</span>
                    </div>
                  </div>
                  {getRoleBadge(member.role)}
                </div>

                <div className="p-3 bg-[#111113] rounded-xl border border-[#27272A] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Assigned Role:</span>
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                      disabled={member.role === 'owner'}
                      className="bg-[#18181B] text-white border border-[#27272A] rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-[#8B5CF6]"
                    >
                      <option value="owner">Owner (Admin)</option>
                      <option value="manager">Manager</option>
                      <option value="trainer">Trainer</option>
                      <option value="frontdesk">Front Desk</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Joined Date:</span>
                    <span>{new Date(member.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#27272A] flex items-center justify-between text-xs">
                  <span className="text-[#22C55E] flex items-center gap-1 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E]" /> Active Session
                  </span>
                  {member.role !== 'owner' && (
                    <button className="text-gray-500 hover:text-[#EF4444] transition-colors">Revoke Access</button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        <Card variant="default" className="p-6 space-y-6 overflow-x-auto">
          <div>
            <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#8B5CF6]" />
              Enterprise Role-Based Access Control (RBAC) Matrix
            </h3>
            <p className="text-xs text-gray-400">Granular feature permissions automatically enforced at API and database RLS boundaries.</p>
          </div>

          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-[#27272A] bg-[#18181B] text-xs font-bold text-gray-300 uppercase">
                <th className="py-3 px-4 rounded-tl-xl">Permission Capability</th>
                <th className="py-3 px-4 text-center">Owner</th>
                <th className="py-3 px-4 text-center">Manager</th>
                <th className="py-3 px-4 text-center">Trainer</th>
                <th className="py-3 px-4 text-center rounded-tr-xl">Front Desk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272A]/50 text-xs text-gray-300">
              {allPerms.map((p) => (
                <tr key={p.key} className="hover:bg-[#18181B]/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-gray-200">{p.label}</td>
                  {(['owner', 'manager', 'trainer', 'frontdesk'] as UserRole[]).map((role) => {
                    const has = PERMISSION_MATRIX[role].includes(p.key);
                    return (
                      <td key={role} className="py-3 px-4 text-center">
                        {has ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#22C55E]/10 text-[#22C55E]">
                            <Check className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#27272A]/50 text-gray-600">
                            <X className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#18181B] border border-[#27272A] rounded-2xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#8B5CF6]" />
                  Invite Staff Member
                </h3>
                <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleInvite} className="space-y-4">
                <Input
                  label="Staff Full Name"
                  required
                  placeholder="e.g. Trainer Vikram"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
                <Input
                  label="Email Address"
                  type="email"
                  required
                  placeholder="e.g. vikram@gymos.app"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <Select
                  label="Assign Roster Role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  options={[
                    { label: 'Trainer (Trials & Leads)', value: 'trainer' },
                    { label: 'Manager (Full Operational Access)', value: 'manager' },
                    { label: 'Front Desk (Inquiry & Check-In)', value: 'frontdesk' },
                  ]}
                />

                <div className="flex justify-end gap-2 pt-2 border-t border-[#27272A]">
                  <Button type="button" variant="secondary" size="md" onClick={() => setShowInviteModal(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" size="md" isLoading={inviting}>
                    Send Email Invite
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
