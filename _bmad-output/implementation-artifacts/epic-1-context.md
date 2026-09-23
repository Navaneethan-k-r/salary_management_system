# Epic 1 Context: HR Organization & Dashboard Initialization

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Establish the core project substrate, design system, and administrator portal foundation. This epic delivers the monorepo workspace, custom Material UI theme, stateful authentication for HR administrators, organization profile management, and the high-level HR administration dashboard summary.

## Stories

- Story 1.1: Project Foundation & UI Theme Initialization
- Story 1.2: HR Admin Authentication & Base Layout
- Story 1.3: Organization Profile Setup
- Story 1.4: HR Dashboard Overview

## Requirements & Constraints

- System must provide initial configuration for organization profile details (name, core settings) persisted in shared MySQL database.
- Admin dashboard must render at `/admin/dashboard` showing high-level metrics (total employee count, recent payroll summary).
- HR administrator authentication uses stateful session tokens validated via Redis cache.
- UI theme must strictly enforce Inter/Roboto typography, flat elevation, primary color `#1976d2`, background `#f4f6f8`, and rounded borders (8px default, 12px cards).
- All currency formatting across dashboards and profiles must strictly use INR (`₹`).
- Rate limiting is omitted per architecture decision AD-5.

## Technical Decisions

- **Architecture Paradigm:** Monorepo using Nx / Turborepo housing `apps/frontend-web`, backend microservices (`apps/service-employee`, `apps/service-payroll`), and shared libraries (`libs/shared-types`, `libs/shared-auth`).
- **Shared Database (AD-1):** MySQL instance shared across backend services; organization and employee profile data live within `service-employee` domain.
- **Frontend Direct Invocation (AD-2):** React frontend communicates directly with `service-employee` REST API endpoints (no API gateway).
- **Session Auth (AD-3):** Opaque token (< 12 chars) stored in Redis as key with session data, passed via `Authorization: Bearer <token>`. Microservices check Redis first with fallback to `service-employee`.
- **Frontend Stack:** React, TypeScript, Redux Toolkit, and Material UI (MUI).

## UX & Interaction Patterns

- **Admin Layout:** Fixed 260px sidebar navigation and top App Bar with 0 elevation.
- **Visual Design:** Professional, minimal, crisp style with 24px container padding, 32px section gap, and subtle 1px border cards rather than heavy shadows.
- **State Feedback:** MUI Skeleton loaders during data fetch; MUI Snackbar for notifications; confirmation dialogs for destructive actions.

## Cross-Story Dependencies

- Story 1.1 establishes the workspace, shared libraries, and MUI theme tokens required by Story 1.2, 1.3, and 1.4.
- Story 1.2 establishes HR authentication, session management, and the base admin layout (sidebar/app bar) needed by Stories 1.3 and 1.4.
- Story 1.3 provides the persisted organization profile data.
- Story 1.4 renders the dashboard overview inside the base admin layout from Story 1.2.
