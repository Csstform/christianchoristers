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
import type { UserRole } from "@/db/schema";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeAppPath(String(formData.get("next") ?? ""));
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
