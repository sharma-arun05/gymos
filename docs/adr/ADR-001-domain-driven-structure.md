# ADR-001: Domain-Driven Structure & Layered Architecture

## Status
Accepted

## Context
As GymOS evolves from a simple dashboard into a comprehensive vertical SaaS platform across CRM, marketing automation, class/trial management, billing, and AI, maintaining a flat monolithic folder structure (`src/services/`, `src/pages/`) creates tight coupling, circular dependencies, and high risk of regression when features change.

## Decision
We adopt **Domain-Driven Design (DDD)** bounded contexts and a strict **Layered Clean Architecture**:
1. All codebase code is organized under `src/domains/<context>/<module>/`.
2. Every domain enforces 4 standard layers:
   - **Repository**: Encapsulates data persistence (Supabase/Postgres) and query caching.
   - **Service**: Houses domain rules, business logic, and state machine transitions.
   - **UseCase**: Orchestrates application workflows, invokes repositories, and emits domain events via `EventBus`.
   - **UI / API**: React components, TanStack Query hooks, and Supabase Edge Functions.
3. Domain services must never directly query another domain's database table; all inter-domain communication occurs through usecase interfaces or reactive EventBus events.

## Consequences
### Positive
- **Zero Monolithic Entanglement**: Modules can be modified, tested, and scaled independently.
- **AI & Automation Readiness**: The UseCase and Repository layers allow AI agents and workflow triggers to execute clean business actions without simulating UI events.
- **High Testability**: Domain rules and state transitions can be unit-tested in Vitest without mocking complex UI contexts.

### Negative
- **More Boilerplate**: Creating separate files for repositories, services, and use cases increases initial file count.
