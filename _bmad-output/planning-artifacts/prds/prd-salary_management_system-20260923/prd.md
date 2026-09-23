---
title: "PRD: Salary Management System"
status: draft
created: 2026-09-23
updated: 2026-09-23
---

# Product Requirements Document: Salary Management System

## 1. Vision & Strategy
The ACME Organization manages salary data for 10,000 employees globally using manual Excel spreadsheets. This process is tedious, error-prone, insecure, and lacks transparency for employees. 

The Salary Management System is a modern web application purpose-built to replace these spreadsheets. It allows HR to efficiently manage salary configurations, generate payslips securely, and provides a self-service portal for employees to view their salary history. 

This is not a full-suite HRIS; it is laser-focused on salary and payslip management.

### Success Criteria
- 100% of the 10,000 employees are successfully migrated from Excel to the platform.
- HR processes a full payroll cycle natively without legacy spreadsheets.
- Employees successfully log in, set passwords, and view payslips.
- System performance allows bulk generation of 10,000 payslips within a reasonable timeframe (e.g., < 5 minutes).

## 2. Target Audience & Roles

- **HR Administrators:** Primary operators. Need efficiency, accuracy, and bulk operations. They manage the employee directory, configure salary components, and generate payslips.
- **Employees (10,000+):** The consumers. Need a frictionless, self-service way to log in, view their current salary configurations, and download historical payslips.

## 3. Functional Requirements (FRs)

### 3.1 Organization Profile Management
- **FR-1.1 System Setup:** HR can configure the initial organization profile to manage their employees.
- **FR-1.2 Admin Dashboard:** HR successfully accesses the administrative dashboard upon setup.

### 3.2 Employee Management
- **FR-2.1 Employee Directory:** HR can add, edit, and delete employee records (fields include email, password, mobile, and salary package).
- **FR-2.2 Onboarding Constraint:** There is no open signup for employees. All employee onboarding is strictly HR-driven.

### 3.3 Salary Configuration
- **FR-3.1 Component Definition:** HR can configure custom salary structures by defining additive components (e.g., Basic, DA, HRA) and deductive components (e.g., PF).
- **FR-3.2 Net Payout Calculation:** The system automatically calculates the net payout based on the defined components.
- **FR-3.3 Currency & Tax [ASSUMPTION]:** Strict support for INR currency only. No localized tax rules engine; tax is handled entirely via manual deductive components defined by HR.

### 3.4 Payslip Operations
- **FR-4.1 Manual Payslip Generation:** HR can manually generate a payslip for an employee by inputting their leave counts.
- **FR-4.2 Bulk Payslip Generation:** HR can bulk generate payslips for the entire organization (assumes 0 leaves / no loss of pay).
- **FR-4.3 Salary Notifications:** HR can trigger "salary credited" notification emails to specific employees or the entire organization using a standardized email template.

### 3.5 Employee Portal
- **FR-5.1 Standard Login:** Employees log in to the employee portal (e.g., `/login`).
- **FR-5.2 First-Time Password Setup:** First-time logins without a set password receive a password setup email and are redirected to a password setup page before authenticating into the portal.
- **FR-5.3 Payslip Viewing:** Employees can access and view historical monthly payslips directly in the web portal, displaying accurate component breakdowns. (No downloadable PDFs).

## 4. Non-Functional Requirements & Architecture

- **Backend Stack:** Node.js, TypeScript, NestJS, RabbitMQ (for bulk generation/emails), Redis, MySQL.
- **Frontend Stack:** React.js, TypeScript, Redux & Redux Toolkit.
- **Performance:** Bulk operations (10,000 payslips) must complete in under 5 minutes.

## 5. Open Questions & Assumptions
- **[NOTE FOR PM] Email Delivery:** Will the system use a specific provider for transactional emails (e.g., SendGrid, AWS SES) for the scale of 10,000 employees?
