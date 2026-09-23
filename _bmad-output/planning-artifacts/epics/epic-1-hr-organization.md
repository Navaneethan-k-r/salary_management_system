# Epic 1: HR Organization & Dashboard Initialization

Allow HR to set up the organization profile and access the administration dashboard as a foundation for managing the company's payroll system.

## Story 1.1: Project Foundation & UI Theme Initialization

As an HR Administrator (and the development team),
I want the foundational Nx monorepo and Material UI theme established (colors, typography, spacing, elevation),
So that the system has a consistent, professional visual identity for all subsequent features.

**Acceptance Criteria:**

**Given** the project is initialized
**When** the application loads
**Then** the custom Material UI theme (Inter/Roboto, specific colors like `#1976d2`, flat elevation) is applied globally
**And** the shared Nx libraries for frontend and backend are established.

## Story 1.2: HR Admin Authentication & Base Layout

As an HR Administrator,
I want to authenticate into the system and see the main administrative layout (Sidebar, App Bar),
So that I can securely navigate between different HR management tools.

**Acceptance Criteria:**

**Given** I am an HR Administrator
**When** I provide valid credentials
**Then** I am authenticated via an opaque token stored in Redis
**And** I am directed to the admin portal with a fixed 260px sidebar and a top App Bar.

## Story 1.3: Organization Profile Setup

As an HR Administrator,
I want to configure the initial organization profile,
So that the system knows which organization's payroll is being managed.

**Acceptance Criteria:**

**Given** I am a logged-in HR Administrator
**When** I navigate to the initial setup screen
**Then** I can input and save the organization's core details
**And** the data is securely stored in the shared MySQL database.

## Story 1.4: HR Dashboard Overview

As an HR Administrator,
I want to view a high-level dashboard displaying total employees and recent payroll runs,
So that I have a quick summary of the organization's current state upon logging in.

**Acceptance Criteria:**

**Given** I am on the `/admin/dashboard` route
**When** the page loads
**Then** I see the total count of employees
**And** I see a summary of the most recent payroll runs.
