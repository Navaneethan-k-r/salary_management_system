# Salary Management System

## Overview
This project is built as an employee salary management software for an organization (ACME) with 10,000 employees. The goal is to migrate the HR team from a tedious Excel-based process to a robust web-based software, enabling the HR manager to seamlessly manage salary data and answer questions about organizational pay.

## Problem Statement
Currently, ACME org's HR team manages salary data for 10,000 employees across multiple countries using Excel spreadsheets. This process is tedious, error-prone, and unscalable. The HR manager requires a web-based platform to manage salary data and gain clear visibility into the organization's payroll.

## Scope & Features
The application is designed around the core needs of HR Administrators to manage payroll and Employees to access their payslips securely.

### Functional Requirements
1. **HR Organization & Dashboard:**
   - Initial organization profile setup.
   - Administrative dashboard summarizing employee counts and payroll runs.
2. **Employee Lifecycle & Onboarding:**
   - HR-driven employee directory (Add, Edit, Delete).
   - No open signup; secure onboarding via magic links and password setup emails.
3. **Salary Structure Configuration:**
   - Custom salary structures with additive (e.g., Basic, DA, HRA) and deductive (e.g., PF) components.
   - Automatic net payout calculation (`Sum(Additive) - Sum(Deductive)`).
   - Strict INR currency formatting.
4. **Payslip Processing & Viewing:**
   - Manual payslip generation with leave input.
   - Bulk payslip generation (processing 10,000 employees under 5 minutes).
   - "Salary credited" email notifications via standard templates.
   - Employee portal to view detailed historical monthly payslips without downloading PDFs.

### What is Deliberately Left Out (and Why)
- **Automated Tax Rules Engine:** Taxes are handled purely via manual deductive components defined by HR. *Reasoning: Tax laws change frequently and differ significantly by region. Hardcoding or building a rules engine adds immense complexity for an MVP. Manual deductions give HR the necessary flexibility.*
- **Open Employee Signups:** Only HR can create employee accounts. *Reasoning: Ensures the directory remains secure and restricted to verified personnel.*
- **Rate Limiting:** Deliberately excluded. *Reasoning: The system is an internal enterprise tool used primarily by HR, minimizing the risk of public abuse.*
- **Downloadable PDFs:** Employees view detailed payslip components directly on the web portal. *Reasoning: Generating and storing 10,000 PDFs monthly consumes significant resources. Displaying the breakdown directly reduces infrastructure load and provides a faster UX.*
- **Multi-Currency Support:** Strict support for INR only. *Reasoning: Simplifies calculations and formatting, ensuring the solution remains focused and scoped for this initial release.*

## Architecture & Technology Stack
- **Architecture Paradigm:** Event-Driven Microservices in a single Nx/Turborepo monorepo.
- **Backend:** Node.js, TypeScript, NestJS.
- **Database:** Shared MySQL database schema across backend services.
- **Frontend:** React.js, TypeScript, Redux & Redux Toolkit with a custom Material UI theme.
- **Authentication:** Stateful Session Authentication using opaque tokens backed by Redis.
- **Eventing:** Event-driven notifications via RabbitMQ for asynchronous email dispatch and bulk generation.

## How to Run
This project uses an Nx monorepo structure. To start the applications locally, follow these steps:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run all services (Frontend, Employee Backend Service, and Worker Service) concurrently:
   ```bash
   npm run dev
   ```

Alternatively, you can run services individually:
- **Frontend Web:** `npm start`
- **Employee Backend Service:** `npm run dev:employee`
- **Worker Service:** `npm run dev:worker`

## Development Approach & AI Agent Usage
The solution was derived using an agentic AI-driven workflow, breaking down the problem systematically:
1. **Requirements Gathering (PRD & Specifications):** The requirements were decomposed into 4 distinct Epics and detailed User Stories.
2. **Architecture & UX Design:** A robust architecture spine and UX design system were established before any code was written.
3. **Iterative Implementation:** Implementation followed incremental commits with meaningful unit tests, clean code structure, and fast/deterministic test cases.
4. **Agentic Tooling:** AI tools were used to analyze requirements, generate architecture documents, write tests, and implement core functionalities iteratively.

*All planning documents, specifications, and architecture decisions can be found in the `_bmad-output/` directory (specifically `planning-artifacts` and `implementation-artifacts`).*

## Current Project Status
Due to AI tool quota limitations during the assessment window, the project is partially complete.
The foundational architecture, CI setup, and initial epics are implemented, while the remaining features have been thoroughly planned and specified.

### Completed & Under Review:
- Project Foundation & UI Theme Initialization
- HR Admin Authentication & Base Layout
- Delete Employee Confirmation
- Backend Authentication API
- Add/Edit Employee Records
- Organization Profile Setup

### In-Progress:
- HR Dashboard Overview
- Employee Directory List & Empty State
- First-Time Employee Onboarding Notification

### Pending (Ready for Dev):
- Employee Password Setup & Portal Login
- Salary Component Definition & Net Payout Calculation Engine
- Manual & Bulk Payslip Generation
- Employee Payslip Viewer

## Documentation References
For a complete review of the thought process, solution design, and architectural decisions, please refer to the following artifacts:
- **Epics & Story Breakdown:** `_bmad-output/planning-artifacts/epics.md`
- **Sprint Status (Progress Tracker):** `_bmad-output/implementation-artifacts/sprint-status.yaml`
- **Feature Specifications:** `_bmad-output/implementation-artifacts/` (e.g., `spec-*.md` files)

---
*This repository represents a structured, production-ready approach to software engineering, prioritizing clear thinking, maintainability, and intentional design over rushed implementations.*
