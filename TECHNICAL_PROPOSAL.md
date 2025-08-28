# Love 4 Detailing — Technical Proposal, Licensing, and Delivery Terms

## 1) Project Overview
Love 4 Detailing is a production-ready, full‑stack platform for mobile car detailing services, built on Next.js App Router with a Supabase backend and a unified design system (Origin UI/shadcn/ui) themed to the brand’s dark/purple identity. The platform supports customer bookings, dynamic pricing, admin scheduling and slot management, rescheduling/cancellation flows, payment confirmation (“Mark as Paid”), and a consistent email system.

This proposal formalizes scope, deliverables, licensing, delivery approach, success criteria, and post‑launch support for the app’s ongoing evolution and operation.

## 2) Objectives & Success Criteria
- Deliver a stable, performant, and secure application that scales with demand.
- Maintain a clean, cohesive brand experience across web and email.
- Preserve and harden business logic while modernizing the UI with Origin UI/shadcn/ui.
- Provide clear governance on IP ownership, third‑party licenses, and delivery terms.

Success criteria (aligned with CODE_OPTIMIZATION_REPORT.md):
- Security score ≥ 9.0/10; strict CSP; zero critical security issues.
- First Load JS < 400kB for key pages; no blocking runtime warnings.
- Test coverage uplift with focus on critical paths (API, booking, auth).
- Consistent design tokens across app and all active emails.
- Robust admin workflows (schedule, approve/decline reschedules, cancel, mark as paid) with correct notifications.

## 3) Scope of Work

### Phase A — Launch Hardening & Stability
- Validate authentication flows (redirects, protected routes, middleware auth gating).
- Ensure time‑slot integrity (no double bookings), reschedule approval correctness, and cancellation reliability.
- Harden API endpoints: `/api/admin/bookings/*`, `/api/admin/reschedule-requests/*`, `/api/admin/time-slots`, `/api/customer/*`, `/api/bookings/*`.
- Email system unification (brand theme, logo header, concise sections); verify all transactional paths.

### Phase B — UI Refresh & UX Improvements
- Systematically replace legacy UI with Origin UI/shadcn/ui primitives and composites via feature flag `NEXT_PUBLIC_NEW_UI` and branch `ui-refresh`.
- Appointment Picker (customer) and Event Calendar (admin) integrations with brand theming.
- Streamlined admin modals/dialogs (QuickView, Booking Details, Reschedule Admin Panel, Mark as Paid) with correct z-index and accessibility.
- Consistent button styles (no icon-in-text buttons) and typography.

### Phase C — Testing, Performance, and Observability
- Add API endpoint tests, component integration tests, and critical E2E paths (booking flow, admin actions, auth).
- Remove perf warnings; address Edge runtime notices; add bundle analysis budgets in CI.
- Introduce environment‑based logging and monitoring; prepare for APM integration post‑launch.

### Phase D — Operations & Handover
- CI/CD pipeline to staging and production with environment gates.
- Documentation set: README, deployment runbooks, environment variable catalogue, incident playbooks.
- Admin onboarding notes and support handover.

## 4) Architecture Summary
- Web: Next.js (App Router), server routes in `src/app/api/*` with standardized response envelopes.
- Data: Supabase (PostgreSQL + RLS), typed via generated `database.types.ts`.
- Auth: Supabase Auth with server‑side middleware and client ProtectedRoute.
- Real‑time/refresh: Polling with cache‑busting and AbortController timeouts; optional live channels future.
- Emails: Resend-powered, unified templates via `EmailService.createUnifiedEmail()` with dark/purple theme.
- Design System: CSS variables in `globals.css`; primitives in `@/components/ui/*`; CVA patterns; feature flag control.

## 5) Key Functional Modules
- Booking Flow: Appointment Picker with day/slot indicators, non‑auto‑advance selection, explicit “Continue”.
- Admin Schedule: Event calendar defaulting to month view; slot add/edit/delete; booked‑slot QuickView with deep‑link and modal.
- Reschedule & Cancellation: Admin approval/decline workflow; idempotent backend; booking history updates; email notifications.
- Payments: “Mark as Paid” modal, audit trail, and branded email confirmations.
- Customer Dashboard: Vehicles, addresses, bookings management with corrected validations and real‑time UI refresh.

## 6) Non‑Functional Requirements
- Security: Strict CSP (no unsafe inline/eval), role‑based access, least‑privilege keys, secrets hygiene.
- Performance: Responsive interactions < 100ms; API p95 under agreed thresholds; client bundle budgets.
- Accessibility: Keyboard navigability for dialogs, color contrast compliance, aria labelling for controls.
- Reliability: No data loss in reschedule/cancel flows; atomic updates for slot switching.

## 7) Deliverables
- Source code in Git repository (including this proposal and CODE_OPTIMIZATION_REPORT.md).
- Configured environments: staging and production with environment parity.
- CI/CD pipeline scripts and config; environment variable templates.
- Test suites: API, component integration, and E2E scaffolding with critical test cases.
- Design tokens and UI primitives library; email HTML templates under unified theme.
- Admin runbooks: schedule management, reschedule approvals, cancellation policy notes.

## 8) Delivery Model & Milestones
- Milestone 1: Launch Hardening (security, auth, emails, critical flows)
- Milestone 2: UI Refresh Cutover (feature‑flagged; togglable)
- Milestone 3: Testing Foundation & Performance Budgets
- Milestone 4: Handover & Support Onboarding

Each milestone has acceptance checkpoints (see §9) and is deployed first to staging for UAT, then to production upon sign‑off.

## 9) Acceptance Criteria & UAT
- All critical user journeys pass on staging: booking creation, reschedule approve/decline, cancellation, payment confirmation.
- No 4xx/5xx regressions in server logs during UAT window for agreed test plans.
- Visual acceptance against design tokens; dialogs accessible; buttons consistent.
- Email templates render correctly across major clients; links and variables correct.

## 10) Post‑Launch Support & SLAs
Support tiers may be offered as:
- Standard: Business hours, response within 1 business day, hotfix within 3 business days.
- Enhanced: Extended hours, response within 4 hours, hotfix within 1 business day.
- Premium: 24×7 pager, response within 1 hour, hotfix within 4 hours.

Incident priorities: P1 (critical outage), P2 (major functionality loss), P3 (minor defect), P4 (cosmetic). SLAs apply per tier.

## 11) Maintenance & Change Management
- Branching: `main` (stable), `ui-refresh` (active UI work), feature branches for discrete tasks.
- Feature Flags: `NEXT_PUBLIC_NEW_UI` to gate new UI without impacting backend flows.
- Versioning: Semantic for service endpoints; maintain API response envelopes.
- Change Control: PR reviews, lint/type checks, CI tests mandatory before merge.

## 12) Licensing & Intellectual Property
### 12.1 Bespoke Code Ownership
- All custom application code authored for Love 4 Detailing is owned by the Client upon payment. Developer retains a non‑exclusive right to reuse generic, non‑client‑specific tooling and patterns (e.g., generic UI scaffolding) not containing client confidential information.

### 12.2 License Grant to Client
- Perpetual, worldwide, non‑transferable, royalty‑free license to use, modify, and deploy the bespoke software for the Client’s business operations.
- The license excludes resale, sublicensing, or offering the software as a product to third parties without a separate agreement.

### 12.3 Third‑Party Software & Components
- The application incorporates third‑party components subject to their licenses, including but not limited to:
  - Next.js (MIT)
  - shadcn/ui (MIT)
  - Origin UI components (subject to Origin UI license/terms; ensure valid usage per their policy)
  - Supabase client libraries (Apache 2.0 / MIT components)
  - Resend SDK (per Resend terms of service)
- Client is responsible for maintaining valid licenses and complying with attribution/usage requirements where applicable. License notices must not be removed from source where required.

### 12.4 Content, Data, and Branding
- All Client content, branding, and assets remain the property of the Client. Developer receives a limited license to use such assets solely to perform the work.

### 12.5 Open‑Source Compliance
- Retain license files and notices. Provide an OSS NOTICE file on request. No copyleft dependencies are knowingly introduced; if later added, material obligations will be disclosed and approved by Client.

## 13) Data Protection & Compliance
- Roles: Client is the Controller of customer data; Supabase acts as a sub‑processor (per Supabase DPA). Resend acts as a processor for outbound email.
- UK GDPR compliant processing: restrict PII exposure, minimize logs, and enforce least‑privilege.
- Data locality and backups governed by Supabase project region and plan; review retention policies.
- Incident response: P1 security incidents trigger immediate response and notification under the chosen support tier.

## 14) Assumptions & Constraints
- Production and staging environment access, billing, and domain/DNS are provisioned by Client.
- Third‑party accounts (Supabase, Resend, analytics, error monitoring) owned by Client.
- Any scope beyond this proposal (new payment providers, marketplace integrations, etc.) will be separately estimated and contracted.

## 15) Risks & Mitigations
- Third‑party rate limits or outages (Supabase/Resend): Retry strategies and operational runbooks.
- UI library changes: Feature flag gating and staged rollout to mitigate regressions.
- Email client variability: Test against major providers; offer plain‑text fallbacks.

## 16) Handover Artifacts
- Admin and operations runbooks (scheduling, reschedule approvals, cancellations, payment confirmation).
- Environment variable catalog and secret rotation guidance.
- Architecture diagram and endpoint index.
- Testing and deployment procedures.

## 17) Acceptance & Sign‑Off
This proposal forms part of the contractual terms for licensing and deliveries. By approving, the Client accepts the scope, deliverables, licensing terms, and delivery approach defined herein. Subsequent changes follow the maintenance & change management process.

---

Prepared by: Senior Engineering Lead
Date: {{YYYY‑MM‑DD}}


