import nodemailer from "nodemailer";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

/** Hosts safe for plaintext / unverified TLS (docker ↔ local Postfix only). */
function isLocalSmtpHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "host.docker.internal"
  );
}

export function getMailer() {
  const host = process.env.SMTP_HOST ?? "localhost";
  const port = Number(process.env.SMTP_PORT ?? "25");
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  // Only honor TLS bypass for loopback/docker-internal SMTP, never for remote relays.
  const ignoreTLS =
    process.env.SMTP_IGNORE_TLS === "true" && isLocalSmtpHost(host);

  return nodemailer.createTransport({
    host,
    port,
    secure,
    ignoreTLS,
    requireTLS: process.env.SMTP_REQUIRE_TLS === "true",
    auth: user ? { user, pass } : undefined,
    tls: ignoreTLS ? { rejectUnauthorized: false } : undefined,
  });
}

export async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const from =
    process.env.SMTP_FROM ??
    process.env.MAIL_FROM ??
    "Christian Choristers <noreply@christianchoristers.com>";

  const transporter = getMailer();
  return transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}

export async function sendInviteEmail(input: {
  to: string;
  name: string;
  inviteUrl: string;
}) {
  const subject = "You're invited to the Christian Choristers member app";
  const text = `Hello ${input.name},

You've been invited to the Christian Choristers member area.

Set your password here:
${input.inviteUrl}

If you did not expect this email, you can ignore it.`;

  // Soft-fail in local/dev when SMTP isn't configured yet
  try {
    if (!process.env.SMTP_HOST && process.env.NODE_ENV !== "production") {
      console.info("[mail:dev] invite email", input);
      return { accepted: [input.to], messageId: "dev-skip" };
    }
    return await sendMail({ to: input.to, subject, text });
  } catch (error) {
    console.error("[mail] failed to send invite", error);
    throw error;
  }
}

export async function sendPasswordResetEmail(input: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  const subject = "Reset your Christian Choristers password";
  const text = `Hello ${input.name},

We received a request to reset your Christian Choristers member password.

Reset it here (expires in 1 hour):
${input.resetUrl}

If you did not request this, you can ignore this email.`;

  try {
    if (!process.env.SMTP_HOST && process.env.NODE_ENV !== "production") {
      console.info("[mail:dev] password reset email", input);
      return { accepted: [input.to], messageId: "dev-skip" };
    }
    return await sendMail({ to: input.to, subject, text });
  } catch (error) {
    console.error("[mail] failed to send password reset", error);
    throw error;
  }
}

export function appBaseUrl(): string {
  return (
    process.env.APP_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  );
}

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST);
}

export async function sendAnnouncementEmails(input: {
  title: string;
  body: string;
  authorName: string;
  recipients: Array<{ email: string; name: string }>;
}): Promise<{ sent: number; failed: number; skipped: boolean; errors: string[] }> {
  if (!input.recipients.length) {
    return { sent: 0, failed: 0, skipped: false, errors: [] };
  }

  // Local/dev without SMTP: log and treat as skipped (announcement still saved)
  if (!isSmtpConfigured() && process.env.NODE_ENV !== "production") {
    console.info("[mail:dev] announcement email", {
      title: input.title,
      recipients: input.recipients.map((r) => r.email),
    });
    return {
      sent: 0,
      failed: 0,
      skipped: true,
      errors: ["SMTP_HOST not set; email skipped in development."],
    };
  }

  const subject = `Announcement: ${input.title}`;
  const link = `${appBaseUrl()}/app/announcements`;
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const recipient of input.recipients) {
    const text = `Hello ${recipient.name},

${input.authorName} posted a new Christian Choristers announcement:

${input.title}

${input.body}

View in the member app:
${link}
`;
    try {
      await sendMail({ to: recipient.email, subject, text });
      sent += 1;
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : "send failed";
      errors.push(`${recipient.email}: ${message}`);
      console.error("[mail] announcement send failed", recipient.email, error);
    }
  }

  return { sent, failed, skipped: false, errors };
}

export function assertSmtpConfiguredForProduction() {
  if (process.env.NODE_ENV === "production") {
    required("SMTP_HOST");
  }
}
