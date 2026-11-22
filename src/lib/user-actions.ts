"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth";
import type { UserRole } from "@/db/schema";
import { canManageUsers } from "@/lib/roles";
import {
  deleteDisabledUser,
  resendInvite,
  updateUserRole,
  updateUserStatus,
} from "@/lib/users";

const ROLES: UserRole[] = ["member", "manager", "director", "admin"];
const STATUSES = ["invited", "active", "disabled"] as const;

function requireAdmin() {
  return getCurrentUser().then((current) => {
    if (!current || !canManageUsers(current.role)) {
      throw new Error("Only admins can manage members.");
    }
    return current;
  });
}

export async function updateMemberRoleAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const current = await requireAdmin();
    const userId = String(formData.get("userId") ?? "");
    const role = String(formData.get("role") ?? "") as UserRole;
    if (!userId || !ROLES.includes(role)) {
      return { ok: false, error: "Invalid role update." };
    }
    const updated = await updateUserRole({
      userId,
      role,
      actorId: current.id,
    });
    revalidatePath("/app/admin");
    return {
      ok: true,
      message: `Updated ${updated.name}'s role to ${updated.role}.`,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Role update failed.",
    };
  }
}

export async function updateMemberStatusAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const current = await requireAdmin();
    const userId = String(formData.get("userId") ?? "");
    const status = String(formData.get("status") ?? "") as
      (typeof STATUSES)[number];
    if (!userId || !STATUSES.includes(status)) {
      return { ok: false, error: "Invalid status update." };
    }
    const updated = await updateUserStatus({
      userId,
      status,
      actorId: current.id,
    });
    revalidatePath("/app/admin");
    return {
      ok: true,
      message: `Updated ${updated.name}'s status to ${updated.status}.`,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Status update failed.",
    };
  }
}

export async function resendMemberInviteAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const current = await requireAdmin();
    const userId = String(formData.get("userId") ?? "");
    if (!userId) {
      return { ok: false, error: "Missing member." };
    }
    const { inviteUrl, email, emailSent } = await resendInvite({
      userId,
      actorId: current.id,
    });
    revalidatePath("/app/admin");
    if (emailSent) {
      return {
        ok: true,
        message: `Invite resent to ${email}.`,
      };
    }
    return {
      ok: true,
      message: `Invite created for ${email}, but email was not sent. Set-password link: ${inviteUrl}`,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Resend failed.",
    };
  }
}

export async function deleteMemberAction(
  userId: string,
): Promise<ActionResult> {
  try {
    const current = await requireAdmin();
    if (!userId) {
      return { ok: false, error: "Missing member." };
    }
    const deleted = await deleteDisabledUser({
      userId,
      actorId: current.id,
    });
    revalidatePath("/app/admin");
    return {
      ok: true,
      message: `Deleted ${deleted.name} (${deleted.email}).`,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Delete failed.",
    };
  }
}
