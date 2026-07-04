# Way Ahead GymOS v1.0 — System Overview

Way Ahead GymOS is an enterprise vertical SaaS platform engineered to act as the central growth operating system for fitness centers, studios, and gyms. It synthesizes the capabilities of modern CRM, marketing automation, class/trial management, billing, and AI analytics into a unified, modular platform.

## Core Architectural Principles
1. **Domain-Driven Design (5 Bounded Contexts)**: We decouple the system into 5 distinct domains (`gym-core`, `crm`, `automation`, `business`, `platform`) to maintain high cohesion and low coupling as the platform scales.
2. **Layered Clean Architecture**: Every bounded context strictly enforces four operational layers:
   - **Repository Layer**: Encapsulates Supabase query execution, caching, and data mappers.
   - **Service Layer**: Houses core domain rules, state machine validations, and business invariants.
   - **UseCase Layer**: Orchestrates user intents (e.g., `CreateLeadUseCase`), coordinates repositories, and emits domain events.
   - **Presentation/API Layer**: React UI views, TanStack Query hooks, and Supabase Edge Functions.
3. **Event-Driven Decoupling (`EventBus`)**: To prevent monolithic dependencies, side effects (such as welcome automations, lead scoring, and telemetry logging) are triggered reactively via type-safe domain events (`LeadCreated`, `TrialBooked`, `MemberJoined`).
4. **Strict Tenant Isolation**: All queries execute within an enforced multi-tenant pipeline: `Request -> Auth -> TenantResolver -> TenantCache -> Row Level Security (RLS)`.
5. **Operational vs. Analytical Separation**: Real-time CRM transactions execute against operational Postgres tables, while executive reporting and charts query a dedicated **Data Warehouse Star Schema** (`fact_leads`, `dim_member`) aggregated asynchronously via Supabase `pg_cron` jobs.
