# Way Ahead GymOS v1.0 — Definition of Done (DoD)

To guarantee the engineering standard **"build once, never rewrite later,"** no module, feature, or bounded context is considered complete until every criterion below is verified:

## 1. Architectural Integrity
- [ ] Code is placed in its appropriate **Bounded Context** (`src/domains/gym-core`, `crm`, `automation`, `business`, or `platform`).
- [ ] Strict layering is adhered to: `Repository -> Service -> UseCase -> UI/API`.
- [ ] Zero cross-domain database queries; communication occurs via domain service interfaces or the `EventBus`.

## 2. Frontend & UI/UX Standards
- [ ] Strictly adheres to the **Global Design System**: `#09090B` (background), `#18181B` (card), `#111113` (surface), `#27272A` (border), `#8B5CF6` (primary).
- [ ] Typography uses the Inter/Geist font scale hierarchy.
- [ ] **Mobile Responsive**: Fully usable and tested on desktop (sidebar layout) and mobile (collapsible drawer layout).
- [ ] **State Handling**:
  - Shimmer skeleton loaders for loading states.
  - Actionable empty states with helpful guidance and CTAs.
  - Clear error states with retry mechanisms.

## 3. Database & Security
- [ ] Supabase Row Level Security (**RLS**) policies are defined and enforced using `public.get_user_gym_id()`.
- [ ] Input validation is implemented via **Zod** schemas in `src/schemas/`.
- [ ] Every state mutation generates an unmutable entry in `audit_logs`.

## 4. Event-Driven & Telemetry Integration
- [ ] Appropriate domain events (e.g., `LeadCreated`, `TrialBooked`) are emitted via `EventBus`.
- [ ] Usage metrics (leads ingested, emails sent, automations executed) are recorded in `usage_metrics`.
- [ ] Performance and error telemetry are logged via `TelemetryService`.

## 5. Testing & Performance
- [ ] All Vitest unit and integration tests pass.
- [ ] End-to-end (E2E) Playwright flows verify critical user paths.
- [ ] Bundle contribution remains within performance budgets (Initial JS < 250KB, Dashboard load < 500ms).
