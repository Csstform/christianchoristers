import nodemailer from "nodemailer";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function getMailer() {
  const host = process.env.SMTP_HOST ?? "localhost";
  const port = Number(process.env.SMTP_PORT ?? "25");
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user ? { user, pass } : undefined,
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

export function appBaseUrl(): string {
  return (
    process.env.APP_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  );
}

export function assertSmtpConfiguredForProduction() {
  if (process.env.NODE_ENV === "production") {
    required("SMTP_HOST");
  }
}
