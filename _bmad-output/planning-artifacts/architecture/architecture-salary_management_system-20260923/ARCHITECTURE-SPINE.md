---
name: 'Salary Management System'
type: architecture-spine
purpose: build-substrate
altitude: initiative
paradigm: 'Event-Driven Microservices in a Monorepo'
scope: 'Salary management, employee access, configurations, and payslips.'
status: final
created: '2026-09-23'
updated: '2026-09-23'
binds: ['CAP-1', 'CAP-2', 'CAP-3', 'CAP-4', 'CAP-5', 'CAP-6', 'CAP-7']
sources: ['SPEC-salary-management-system']
companions: []
---

# Architecture Spine — Salary Management System

## Design Paradigm

**Event-Driven Microservices in a Monorepo**
The system is divided into bounded contexts (Employee, Payroll, Notification) acting as autonomous microservices, all co-located within a single Nx/Turborepo monorepo to share TypeScript interfaces and common libraries (like Authentication). 

## Invariants & Rules

### AD-1 — Shared Database Pattern
- **Binds:** `all` backend services (Employee, Payroll)
- **Prevents:** Data synchronization overhead, data duplication, and complex async eventual consistency logic.
- **Rule:** Backend services connect to and query the same shared MySQL database schema. The Payroll Service directly queries employee data stored by the Employee Service.

### AD-2 — Direct Microservice Invocation
- **Binds:** Frontend application network calls
- **Prevents:** Unnecessary bottlenecking and the operational overhead of maintaining an API Gateway for a small-scope internal tool.
- **Rule:** The React frontend must communicate directly with individual microservice public endpoints rather than routing through an aggregation layer.

### AD-3 — Stateful Session Authentication
- **Binds:** Authentication flow across all services
- **Prevents:** The overhead of stateless JWT validation and immediate token revocation complexities.
- **Rule:** Authentication relies on an opaque token (< 12 characters). The token serves as the key in a shared Redis cache containing the user session data. Services must check Redis first; on a cache miss, they fallback to the Employee Service to validate.

### AD-4 — Event-Driven Notifications
- **Binds:** Notification Service, Employee Service, Payroll Service
- **Prevents:** Synchronous blocking calls during critical flows (like generating bulk payslips) just to send emails.
- **Rule:** Services must publish domain events (e.g., `payslip.generated`) to RabbitMQ. The Notification Service consumes these events to dispatch emails asynchronously.

### AD-5 — Omit Rate Limiting
- **Binds:** API Security Layer
- **Prevents:** Over-engineering for a small internal HR tool.
- **Rule:** Rate limiting is intentionally excluded from the architecture based on project scope.

```mermaid
flowchart TD
    UI[Frontend Web (React/MUI)]
    
    subgraph Microservices
      ES[Employee Service]
      PS[Payroll Service]
    end
    
    subgraph Async Workers
      NS[Notification Service]
    end
    
    subgraph Infrastructure
      Redis[(Redis Cache)]
      MySQL[(Shared MySQL DB)]
      RabbitMQ((RabbitMQ))
    end
    
    UI -->|Direct HTTP| ES
    UI -->|Direct HTTP| PS
    
    ES -->|Auth token check| Redis
    PS -->|Auth token check| Redis
    PS -.->|Fallback Auth| ES
    
    ES -->|Read/Write| MySQL
    PS -->|Read/Write| MySQL
    
    PS -->|Publish| RabbitMQ
    ES -->|Publish| RabbitMQ
    RabbitMQ -->|Consume| NS
```

## Consistency Conventions

| Concern | Convention |
| --- | --- |
| Naming | Services prefixed with `service-`, UI with `frontend-`, shared libs with `shared-`. |
| Data & formats | ISO 8601 for dates. INR strictly for all currency fields (no multi-currency support). |
| Auth | Tokens passed via standard `Authorization: Bearer <token>` HTTP header. |

## Stack

| Name | Version |
| --- | --- |
| Node.js | Latest LTS |
| TypeScript | Latest |
| NestJS | Latest |
| React.js | Latest |
| Redux / Redux Toolkit | Latest |
| Material UI (MUI) | Latest |
| RabbitMQ | Latest |
| Redis | Latest |
| MySQL | Latest |
| Nx / Turborepo | Latest |

## Structural Seed

```text
/
  apps/
    frontend-web/        # React + Redux + MUI application
    service-employee/    # NestJS (Employee records, HR Config, Auth)
    service-payroll/     # NestJS (Salary config, Leave counts, Payslips)
    service-worker/      # NestJS (RabbitMQ Notification consumer)
  libs/
    shared-types/        # Shared TypeScript interfaces & DTOs
    shared-auth/         # Redis auth validation logic shared by backend services
```

## Capability → Architecture Map

| Capability / Area | Lives in | Governed by |
| --- | --- | --- |
| CAP-1: System Setup | `service-employee` | AD-1 |
| CAP-2: Employee Management | `service-employee` | AD-1, AD-4 |
| CAP-3: Salary Configuration | `service-payroll` | AD-1 |
| CAP-4: Salary Notifications | `service-worker` | AD-4 |
| CAP-5: Employee Access | `service-employee`, `shared-auth` | AD-3 |
| CAP-6: Payslip Viewing | `service-payroll` | AD-1, AD-3 |
| CAP-7: Payslip Generation | `service-payroll` | AD-1, AD-4 |

## Deferred
- Operational envelope (CI/CD, deployment strategy, container orchestration) is deferred until implementation, as it is non-critical for this altitude.
