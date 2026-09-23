---
title: 'Story 2.5: Employee Password Setup'
type: 'feature'
created: '2026-09-23'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** When a new employee receives the onboarding email with the activation link, the backend endpoint to validate the token and the frontend page to set their password do not exist, preventing them from accessing the portal.

**Approach:** Implement a frontend password setup page that extracts the activation token from the URL and allows the user to securely set their password. On the backend, create an endpoint to validate this token, hash and store the new password, and mark the employee's account as active.

## Boundaries & Constraints

**Always:**
- Validate the stateful activation token against the database before allowing a password reset.
- Require the user to confirm their password (e.g., "Password" and "Confirm Password" fields) on the frontend.
- Provide clear error messaging if the token is invalid, expired, or already used.
- Upon successful password setup, mark the employee account as activated.

**Never:**
- Do not store the new password in plaintext.
- Do not log the token or the new password in backend logs.
- Do not allow open signup; if a token is invalid, instruct the user to contact HR.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Valid Token | User submits a valid new password with a valid token | Password is updated, account activated, user receives success message | N/A |
| Invalid / Used Token | Token from URL does not exist or is marked used | Prevent password submission | Show error UI: "This link is invalid or expired. Please contact HR." |
| Password Mismatch | User's "Password" and "Confirm Password" don't match | Prevent form submission | Show inline validation error |
| Weak Password | Password doesn't meet minimum requirements | Prevent form submission | Show inline validation error detailing requirements |

- **Decision Record:** LOGIN AFTER SETUP - Redirect to login (Require the user to log in manually using their email and new password)
- **Decision Record:** PASSWORD COMPLEXITY - Strict (Min 8 chars, 1 uppercase, 1 number, 1 special character)
- **Decision Record:** TOKEN EXPIRY - 24 hours (Tokens expire quickly for security)

</frozen-after-approval>


## Code Map

- `apps/frontend-web/src/pages/PasswordSetupPage.tsx` -- New page for the password setup UI.
- `apps/frontend-web/src/services/authService.ts` -- Add method to submit the password setup request.
- `apps/frontend-web/src/app/App.tsx` -- Add route for `/setup-password`.
- `apps/service-employee/src/auth/auth.controller.ts` -- New endpoint `POST /api/auth/setup-password`.
- `apps/service-employee/src/auth/auth.service.ts` -- Business logic to validate token, hash password, and activate account.

## Tasks & Acceptance

**Execution:**
- [ ] `apps/service-employee/src/auth/auth.controller.ts` & `auth.service.ts` -- Create token validation and password setup endpoint -- Secures the onboarding process.
- [ ] `apps/frontend-web/src/services/authService.ts` -- Add client method for the new endpoint -- Connects frontend to the backend action.
- [ ] `apps/frontend-web/src/pages/PasswordSetupPage.tsx` -- Build the password setup UI -- Provides the interface for the employee to enter their password.
- [ ] `apps/frontend-web/src/app/App.tsx` -- Register the `/setup-password` route -- Makes the page accessible via the email link.

**Acceptance Criteria:**
- Given I am a new employee with a valid activation link, when I visit the link, then I see a page to set up my password.
- Given I submit a valid password on the setup page, then my password is saved securely, my account is activated, and I see a success message.
- Given I visit an invalid or expired activation link, when the page loads, then I see an error message instructing me to contact HR and cannot set a password.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm test` -- expected: Unit tests for the password setup backend logic pass.
- `npm run build` -- expected: Monorepo builds cleanly.

**Manual checks (if no CLI):**
- Verify visiting the setup page with a mock invalid token shows an error.
- Verify submitting the form with a valid token successfully updates the password and activates the user.
