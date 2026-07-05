// ============================================================================
// Main Application Routing (src/App.tsx)
// Registers all 20 enterprise SaaS modules inside ProtectedRoute & AppLayout.
// ============================================================================

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { GymProvider } from './context/GymContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Core Pages
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { GymOnboarding } from './pages/onboarding/GymOnboarding';
import { Dashboard } from './pages/dashboard/Dashboard';
import { LeadsCRM } from './pages/leads/LeadsCRM';
import { Templates } from './pages/templates/Templates';
import { SequenceBuilder } from './pages/sequences/SequenceBuilder';
import { FollowUpEngine } from './pages/automations/FollowUpEngine';
import { Billing } from './pages/billing/Billing';

// Enterprise Modules (Waves 2, 3, 4, 5)
import { CommunicationHub } from './pages/inbox/CommunicationHub';
import { NotificationCenter } from './pages/notifications/NotificationCenter';
import { TrialManager } from './pages/trials/TrialManager';
import { WidgetManager } from './pages/widgets/WidgetManager';
import { WidgetAnalytics } from './pages/widgets/WidgetAnalytics';
import { ConversionHub } from './pages/conversions/ConversionHub';
import { TaskManager } from './pages/tasks/TaskManager';
import { AnalyticsHub } from './pages/analytics/AnalyticsHub';
import { TeamManager } from './pages/team/TeamManager';
import { SettingsSuite } from './pages/settings/SettingsSuite';
import { AiAssistantSettings } from './pages/settings/AiAssistantSettings';
import { AuditLogHub } from './pages/audit/AuditLogHub';
import { FileManager } from './pages/files/FileManager';
import { Marketplace } from './pages/integrations/Marketplace';
import { RetentionHub } from './pages/retention/RetentionHub';
import { AiIntelligenceHub } from './pages/ai/AiIntelligenceHub';
import { SupportHub } from './pages/support/SupportHub';
import { ObservabilityHub } from './pages/observability/ObservabilityHub';
import { BackupCenter } from './pages/backups/BackupCenter';
import { SuperAdminPortal } from './pages/admin/SuperAdminPortal';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes — GymProvider resolves tenant identity from auth */}
          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<GymProvider><GymOnboarding /></GymProvider>} />
            
            {/* App Layout Routes */}
            <Route element={<GymProvider><AppLayout /></GymProvider>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/leads" element={<LeadsCRM />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/sequences" element={<SequenceBuilder />} />
              <Route path="/automations" element={<FollowUpEngine />} />
              <Route path="/billing" element={<Billing />} />
              
              {/* Enterprise SaaS Extensions */}
              <Route path="/inbox" element={<CommunicationHub />} />
              <Route path="/notifications" element={<NotificationCenter />} />
              <Route path="/trials" element={<TrialManager />} />
              <Route path="/widgets" element={<WidgetManager />} />
              <Route path="/widgets/analytics" element={<WidgetAnalytics />} />
              <Route path="/conversions" element={<ConversionHub />} />
              <Route path="/tasks" element={<TaskManager />} />
              <Route path="/analytics" element={<AnalyticsHub />} />
              <Route path="/team" element={<TeamManager />} />
              <Route path="/settings" element={<SettingsSuite />} />
              <Route path="/settings/ai-assistant" element={<AiAssistantSettings />} />
              <Route path="/audit" element={<AuditLogHub />} />
              <Route path="/files" element={<FileManager />} />
              <Route path="/integrations" element={<Marketplace />} />
              <Route path="/retention" element={<RetentionHub />} />
              <Route path="/ai" element={<AiIntelligenceHub />} />
              <Route path="/support" element={<SupportHub />} />
              <Route path="/observability" element={<ObservabilityHub />} />
              <Route path="/backups" element={<BackupCenter />} />
              <Route path="/admin" element={<SuperAdminPortal />} />
            </Route>
            
            {/* Default redirect to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
