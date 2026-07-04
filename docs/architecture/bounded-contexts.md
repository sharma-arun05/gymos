# Way Ahead GymOS v1.0 — Bounded Contexts

GymOS is organized into 5 Bounded Contexts residing in `src/domains/`. Each domain encapsulates its own models, repositories, services, and use cases.

## 1. Gym-Core (`src/domains/gym-core`)
- **Responsibilities**: Tenant onboarding, identity management, Role-Based Access Control (RBAC), and gym profile settings.
- **Sub-modules**:
  - `/auth`: User profiles, sessions, role verification (`Owner`, `Manager`, `Sales`, `Trainer`, `Support`).
  - `/tenancy`: Tenant context resolution, `TenantResolver`, and RLS helper utilities.
  - `/settings`: Branding, domain names, third-party API keys, and notification preferences.

## 2. CRM (`src/domains/crm`)
- **Responsibilities**: Prospect acquisition, lead pipeline management, trial scheduling, membership conversions, and staff tasks.
- **Sub-modules**:
  - `/leads`: 9-stage pipeline, lead scoring (Hot/Warm/Cold), profile timeline, tags, and custom fields.
  - `/trials`: Trial calendar, booking workflows, attendance confirmation, and trainer assignment.
  - `/conversions`: Trial-to-member conversion tracking, sales leaderboards, and commission attribution.
  - `/tasks`: Staff task assignments, due dates, priority tags, and recurring task schedules.

## 3. Automation (`src/domains/automation`)
- **Responsibilities**: Multi-channel communications, node-based workflow execution, queue processing, and notifications.
- **Sub-modules**:
  - `/workflows`: Workflow definitions, versioning (`workflow_definitions`, `workflow_versions`), and execution tracing.
  - `/jobs`: BullMQ/Redis compatible queue processor with partitioned priority levels (`high`, `normal`, `low`, `dead_letter`).
  - `/communications`: Unified inbox (WhatsApp, Email, SMS), template variable replacement, and delivery tracking.
  - `/notifications`: Real-time alerts (in-app bell, email, SMS) for staff and owners.

## 4. Business (`src/domains/business`)
- **Responsibilities**: Subscription monetization, executive analytics, automated churn retention, and AI generation.
- **Sub-modules**:
  - `/billing`: Razorpay subscription lifecycle (`Starter`, `Growth`, `Pro`, `Enterprise`), invoicing, and tier quotas.
  - `/analytics`: Funnel, marketing (CAC/LTV/ROI), and business health (MRR/ARR/Churn) powered by Star Schema ETL.
  - `/retention`: Member churn prediction, inactivity alerts (no check-in > 14 days), and win-back workflows.
  - `/ai`: AI Followup Writer, AI Lead Analysis (conversion probability), and AI Executive Analytics with prompt governance.

## 5. Platform (`src/domains/platform`)
- **Responsibilities**: System observability, usage metering, feature flags, audit logging, file storage, and SuperAdmin tools.
- **Sub-modules**:
  - `/feature-flags`: Module toggles, beta feature rollout, and plan-based feature gates.
  - `/metering`: Real-time quota tracking (leads ingested, automations run, API calls).
  - `/observability`: Telemetry tracking (API latency, database errors, queue failures, webhook delivery).
  - `/admin`: SuperAdmin executive metrics (MRR, ARR, NRR, DAU/MAU, platform health).
  - `/files`: Document repository (contracts, attachments, trainer certifications) ready for Cloudflare R2 / Supabase Storage.
  - `/support`: Customer ticketing, feature request voting, and NPS customer health scoring.
