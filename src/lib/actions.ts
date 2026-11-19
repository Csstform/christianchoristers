"use server";

import { redirect } from "next/navigation";
import {
  acceptInvite,
  createInvite,
  destroySession,
  getCurrentUser,
  loginWithPassword,
} from "@/lib/auth";
import { canManageUsers } from "@/lib/roles";
import type { UserRole } from "@/db/schema";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  try {
    await loginWithPassword({ email, password });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Login failed.",
    };
  }
  redirect("/app");
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
    const { inviteUrl } = await createInvite({ email, name, role });
    return {
      ok: true,
      message: `Invite created for ${email}. Set-password link: ${inviteUrl}`,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Invite failed.",
    };
  }
}
