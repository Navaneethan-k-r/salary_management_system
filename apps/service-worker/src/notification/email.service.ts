import { Injectable, Logger } from '@nestjs/common';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Handles dispatching onboarding emails to newly created employees.
 *
 * Dev behaviour: logs the activation URL to stdout (no real email sent).
 * Production behaviour: POSTs a payload to a Zapier webhook URL specified
 * in the ZAPIER_WEBHOOK_URL environment variable, allowing Zapier to
 * dispatch the email.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendOnboardingEmail(payload: {
    employeeId: string;
    email: string;
    fullName: string;
    organizationId: string;
    activationToken: string;
  }): Promise<void> {
    const setupUrl = `${FRONTEND_URL}/setup-password?token=${payload.activationToken}`;

    const isDev = (process.env.NODE_ENV || 'development') === 'development';

    if (isDev) {
      // Dev: mock email delivery by logging the URL
      this.logger.log(
        `[DEV] Onboarding email for ${payload.email} (${payload.fullName}): ` +
        `Setup URL → ${setupUrl}`,
      );
      return;
    }

    // Production: POST to Zapier webhook
    const zapierUrl = process.env.ZAPIER_WEBHOOK_URL;
    if (!zapierUrl) {
      this.logger.error(
        `[EmailService] ZAPIER_WEBHOOK_URL is not configured. ` +
        `Onboarding email for ${payload.email} could not be sent.`,
      );
      return;
    }

    const body = JSON.stringify({
      employee_id: payload.employeeId,
      email: payload.email,
      full_name: payload.fullName,
      organization_id: payload.organizationId,
      setup_url: setupUrl,
    });

    try {
      const response = await fetch(zapierUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (!response.ok) {
        this.logger.error(
          `[EmailService] Zapier webhook returned ${response.status} for employee ${payload.employeeId}.`,
        );
        return;
      }

      this.logger.log(`[EmailService] Onboarding email dispatched for employee ${payload.employeeId}`);
    } catch (err: any) {
      // Log failure but do not crash the worker
      this.logger.error(
        `[EmailService] Failed to POST to Zapier for employee ${payload.employeeId}: ${err.message}`,
      );
    }
  }
}
