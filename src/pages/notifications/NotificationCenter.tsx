// ============================================================================
// Multi-Channel Notification Center UI (/notifications)
// Feed & Preferences for In-App, Email, and SMS alerts.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Settings, ShieldAlert, UserCheck, Calendar } from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { Button, Card, EmptyState } from '../../components/ui';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'trial_reminder' | 'lead_assigned' | 'renewal_due' | 'system_alert';
  isRead: boolean;
  createdAt: string;
}

export const NotificationCenter: React.FC = () => {
  const { gymId } = useGym();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'preferences'>('feed');

  // Preference toggles
  const [emailAlerts, setEmailAlerts] = useState<boolean>(true);
  const [smsAlerts, setSmsAlerts] = useState<boolean>(true);
  const [inAppAlerts, setInAppAlerts] = useState<boolean>(true);

  useEffect(() => {
    if (gymId) loadNotifications();
  }, [gymId]);

  const loadNotifications = async () => {
    try {
      // Mock notifications or load from database
      const demoNotifications: NotificationItem[] = [
        {
          id: '1',
          title: '🔥 New Hot Lead Assigned',
          message: 'Rahul Sharma (Score: 92) requested an immediate callback regarding Pro Annual Membership.',
          type: 'lead_assigned',
          isRead: false,
          createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
        },
        {
          id: '2',
          title: '📅 Trial Session Starting Soon',
          message: 'Sneha Patel is scheduled for a VIP Trial workout in 30 minutes with Trainer Vikram.',
          type: 'trial_reminder',
          isRead: false,
          createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
        },
        {
          id: '3',
          title: '⚠️ Membership Renewal Due',
          message: 'Amit Kumar’s quarterly membership expires in 3 days. Automated WhatsApp renewal reminder dispatched.',
          type: 'renewal_due',
          isRead: true,
          createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
        },
        {
          id: '4',
          title: '🛡️ System Security & Backup',
          message: 'Daily automated data warehouse snapshot and pg_cron cleanup completed successfully.',
          type: 'system_alert',
          isRead: true,
          createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
        },
      ];
      setNotifications(demoNotifications);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'lead_assigned': return <UserCheck className="w-5 h-5 text-[#8B5CF6]" />;
      case 'trial_reminder': return <Calendar className="w-5 h-5 text-[#22C55E]" />;
      case 'renewal_due': return <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />;
      case 'system_alert': return <ShieldAlert className="w-5 h-5 text-[#3B82F6]" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#8B5CF6]" />
            Notification Center
          </h1>
          <p className="text-sm text-gray-400">Real-time alerts for incoming leads, trial appointments, and renewal schedules.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'feed' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('feed')}
          >
            Activity Feed ({notifications.filter((n) => !n.isRead).length})
          </Button>
          <Button
            variant={activeTab === 'preferences' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('preferences')}
            leftIcon={<Settings className="w-4 h-4" />}
          >
            Preferences
          </Button>
        </div>
      </div>

      {activeTab === 'feed' ? (
        <Card variant="default" className="space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
            <h3 className="text-base font-bold text-gray-100">Recent Alerts</h3>
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          </div>
          <div className="divide-y divide-[#27272A]/50">
            {notifications.length === 0 ? (
              <EmptyState title="No Notifications" description="You are all caught up! When incoming events occur, they will appear here." />
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`py-4 flex items-start gap-4 transition-colors ${!item.isRead ? 'bg-[#8B5CF6]/5 px-3 rounded-xl' : ''}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#111113] border border-[#27272A] flex items-center justify-center shrink-0 shadow-sm">
                    {getNotificationIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                        {item.title}
                        {!item.isRead && <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">{item.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      ) : (
        <Card variant="default" className="space-y-6 p-6">
          <div className="border-b border-[#27272A] pb-4">
            <h3 className="text-base font-bold text-gray-100">Multi-Channel Alert Routing</h3>
            <p className="text-xs text-gray-400">Configure how and where your staff receives critical automated notifications.</p>
          </div>

          <div className="space-y-4">
            {[
              { label: 'In-App Notifications', desc: 'Receive real-time bell alerts inside the GymOS desktop and mobile dashboard.', state: inAppAlerts, toggle: setInAppAlerts },
              { label: 'Email Digest Alerts', desc: 'Send daily summary digests and urgent lead notifications to staff email addresses.', state: emailAlerts, toggle: setEmailAlerts },
              { label: 'SMS & WhatsApp Broadcasts', desc: 'Dispatch instant SMS/WhatsApp alerts to trainers 1 hour prior to scheduled trial appointments.', state: smsAlerts, toggle: setSmsAlerts },
            ].map((pref, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-[#111113] rounded-xl border border-[#27272A]">
                <div>
                  <h4 className="text-sm font-bold text-gray-100">{pref.label}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">{pref.desc}</p>
                </div>
                <button
                  onClick={() => pref.toggle(!pref.state)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                    pref.state ? 'bg-[#8B5CF6]' : 'bg-[#27272A]'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      pref.state ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-end">
            <Button variant="primary" size="md">
              Save Preferences
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
