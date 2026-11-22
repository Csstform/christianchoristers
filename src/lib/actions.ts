"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  acceptInvite,
  createInvite,
  destroySession,
  getCurrentUser,
  loginWithPassword,
} from "@/lib/auth";
import { canManageUsers } from "@/lib/roles";
import { safeAppPath } from "@/lib/paths";
import {
  requestPasswordReset,
  resetPasswordWithToken,
} from "@/lib/password-reset";
import { clientKeyFromAction, takeRateLimit } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import type { UserRole } from "@/db/schema";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeAppPath(String(formData.get("next") ?? ""));
  const clientKey = await clientKeyFromAction();
  const limited = takeRateLimit({
    key: `login:${clientKey}`,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!limited.ok) {
    return {
      ok: false,
      error: `Too many login attempts. Try again in ${limited.retryAfterSec}s.`,
    };
  }

  const turnstile = await verifyTurnstileToken({
    token: String(formData.get("cf-turnstile-response") ?? ""),
    remoteip: clientKey === "local" || clientKey === "unknown" ? undefined : clientKey,
  });
  if (!turnstile.ok) {
    return { ok: false, error: turnstile.error };
  }

  try {
    await loginWithPassword({ email, password });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Login failed.",
    };
  }
  redirect(next);
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

export async function acceptInviteAction(
  token: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password !== confirm) {
    return { ok: false, error: "Passwords do not match." };
  }
  try {
    await acceptInvite({ token, password });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Invite failed.",
    };
  }
  redirect("/app");
}

export async function requestPasswordResetAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "");
  const clientKey = await clientKeyFromAction();
  const limited = takeRateLimit({
    key: `reset:${clientKey}:${email.trim().toLowerCase() || "blank"}`,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!limited.ok) {
    return {
      ok: false,
      error: `Too many reset requests. Try again in ${limited.retryAfterSec}s.`,
    };
  }

  const turnstile = await verifyTurnstileToken({
    token: String(formData.get("cf-turnstile-response") ?? ""),
    remoteip: clientKey === "local" || clientKey === "unknown" ? undefined : clientKey,
  });
  if (!turnstile.ok) {
    return { ok: false, error: turnstile.error };
  }

  try {
    const { message } = await requestPasswordReset(email);
    return { ok: true, message };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Could not start password reset.",
    };
  }
}

export async function resetPasswordAction(
  token: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password !== confirm) {
    return { ok: false, error: "Passwords do not match." };
  }
  try {
    await resetPasswordWithToken({ token, password });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Reset failed.",
    };
  }
  redirect("/app");
}

export async function inviteUserAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const current = await getCurrentUser();
  if (!current || !canManageUsers(current.role)) {
    return { ok: false, error: "Only admins can invite users." };
  }

  const email = String(formData.get("email") ?? "");
  const name = String(formData.get("name") ?? "");
  const role = String(formData.get("role") ?? "member") as UserRole;
  const clientKey = await clientKeyFromAction();
  const limited = takeRateLimit({
    key: `invite:${current.id}`,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return {
      ok: false,
      error: `Too many invites. Try again in ${limited.retryAfterSec}s.`,
    };
  }

  try {
    const { inviteUrl, emailSent } = await createInvite({ email, name, role });
    revalidatePath("/app/admin");
    if (emailSent) {
      return {
        ok: true,
        message: `Invite emailed to ${email}.`,
      };
    }
    return {
      ok: true,
      message: `Invite created for ${email}, but email was not sent. Set-password link: ${inviteUrl}`,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Invite failed.",
    };
  }
}
