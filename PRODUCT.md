# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are property management companies and landlords who run day-to-day rental operations through the app — admins and owners are the primary operators. Two supporting roles use the same app: workers (maintenance staff assigned to jobs) and tenants (renters), who get scoped, lighter-weight views of the same data (their own maintenance requests, lease, documents, rent).

Terminology note for future work: `Tenant` in the codebase (and "tenant" in multi-tenant/company context) means the property-management company/client (has its own subdomain, its own users, properties, data). The `tenant` **role** means a renter. These are two unrelated senses of the same word — copy and UI must disambiguate them (e.g. "company" vs. "renter") rather than reuse "tenant" for both.

## Product Purpose

MiNi Property lets a property management company run its full operation from one app: list and manage properties/units, track leases and rent, handle maintenance requests end-to-end (submission → assignment → live chat → completion → tenant confirmation with rating), store documents, and communicate with tenants — with role-based access so admins, owners, workers, and tenants each see only what's relevant to them. Success is a maintenance/rent/lease workflow that stays coordinated in real time without phone calls or spreadsheets.

## Positioning

MiNi Property positions itself as a real-time operations hub rather than a static records system: maintenance requests carry a live per-ticket chat with typing indicators and instant delivery (SSE), role-aware notifications (bell, sound, email) fire on every state change (assignment, completion, new chat message), and the tenant confirmation/rating loop closes the feedback cycle automatically. A generic property-management competitor built around forms and periodic status updates could not truthfully claim the same immediacy.

## Operating Context

Multi-tenant SaaS: each property management company is an isolated `Tenant` (own subdomain, users, properties, data), invite-based user onboarding, and locale support for English and German (`en`/`de` dictionaries), suggesting a DACH-region-aware audience alongside English speakers. Core workflows: property/unit/lease management, rent tracking, the maintenance request lifecycle (submit → assign worker → live chat → mark complete → tenant confirms/rates → reopen if not done), document storage (leases, invoices, notices), an internal news/announcements feed, and outbound webhooks for external integrations. Email (Resend, with SMTP fallback) drives tenant invitations and maintenance status notifications.

## Capabilities and Constraints

- Roles: `admin`, `owner`, `worker`, `tenant` — route- and API-level access is role-gated (see `src/config/nav.ts`, `requireRole()` in `src/lib/auth.ts`).
- Real-time layer: a single shared SSE connection per session drives live notifications, chat messages, and typing indicators — deliberately kept to one connection per client to avoid competing streams.
- AI features (Gemini via Genkit) are optional: an AI-assisted property listing generator and an AI tenant-facing chatbot/assistant, both behind a configurable per-IP rate limit; the app is expected to work with graceful fallback if no AI key is configured.
- Worker statistics/reporting surface exists for admin, owner, and worker roles.
- Undecided: no confirmed pricing, plan tiers, or self-serve signup story yet (invites are the only onboarding path seen in code).

## Evidence on Hand

None. This is a personal/portfolio project (originated from a Firebase Studio Next.js starter) with no real company or customer data. No testimonials, case studies, screenshots, or press exist — future work must not fabricate any.

## Product Principles

1. Real-time coordination over static records — state changes should be visible and communicated immediately to everyone with a stake in them.
2. Role-scoped clarity — each of the four roles sees exactly the slice of the operation relevant to their job, nothing more.
3. Data isolation by company is non-negotiable — every model and query is tenant-scoped; this is a security property as much as an architectural one.
4. AI assists, never gates — AI-powered features (listing generation, chatbot) must degrade gracefully when unavailable rather than blocking core workflows.
5. Close the loop — workflows like maintenance requests aren't done until the original requester (the tenant) confirms, not just when the worker marks it complete.
