import { and, asc, count, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  invites,
  sessions,
  users,
  type User,
  type UserRole,
} from "@/db/schema";
import { generateToken, hashToken } from "@/lib/crypto";
import { invalidateOutstandingInvites } from "@/lib/invites";
import { appBaseUrl, sendInviteEmail } from "@/lib/mail";

const INVITE_DAYS = 14;

export type ManagedUser = Pick<
  User,
  "id" | "email" | "name" | "role" | "status" | "createdAt" | "updatedAt"
>;

export async function listUsers(): Promise<ManagedUser[]> {
  return db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .orderBy(asc(users.name), asc(users.email));
}

export async function getUserById(id: string): Promise<User | undefined> {
  return db.query.users.findFirst({ where: eq(users.id, id) });
}

async function countActiveAdmins(excludeUserId?: string): Promise<number> {
  const conditions = [eq(users.role, "admin"), eq(users.status, "active")];
  if (excludeUserId) {
    conditions.push(ne(users.id, excludeUserId));
  }
  const rows = await db
    .select({ value: count() })
    .from(users)
    .where(and(...conditions));
  return Number(rows[0]?.value ?? 0);
}

export async function updateUserRole(input: {
  userId: string;
  role: UserRole;
  actorId: string;
}): Promise<ManagedUser> {
  if (input.userId === input.actorId) {
    throw new Error("You cannot change your own role.");
  }

  const target = await getUserById(input.userId);
  if (!target) {
    throw new Error("Member not found.");
  }

  if (
    target.role === "admin" &&
    target.status === "active" &&
    input.role !== "admin"
  ) {
    const remaining = await countActiveAdmins(target.id);
    if (remaining < 1) {
      throw new Error("Cannot demote the last active admin.");
    }
  }

  const [updated] = await db
    .update(users)
    .set({ role: input.role, updatedAt: new Date() })
    .where(eq(users.id, input.userId))
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });

  return updated;
}

export async function updateUserStatus(input: {
  userId: string;
  status: User["status"];
  actorId: string;
}): Promise<ManagedUser> {
  if (input.userId === input.actorId) {
    throw new Error("You cannot change your own status.");
  }

  const target = await getUserById(input.userId);
  if (!target) {
    throw new Error("Member not found.");
  }

  if (input.status === "disabled") {
    if (target.role === "admin" && target.status === "active") {
      const remaining = await countActiveAdmins(target.id);
      if (remaining < 1) {
        throw new Error("Cannot disable the last active admin.");
      }
    }
  }

  if (input.status === "active" && !target.passwordHash) {
    throw new Error(
      "This member has not set a password yet. Resend their invite instead.",
    );
  }

  if (input.status === "invited" && target.status === "active") {
    throw new Error("Active members cannot be moved back to invited.");
  }

  const [updated] = await db
    .update(users)
    .set({ status: input.status, updatedAt: new Date() })
    .where(eq(users.id, input.userId))
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });

  if (input.status === "disabled") {
    await db.delete(sessions).where(eq(sessions.userId, input.userId));
    await invalidateOutstandingInvites(input.userId);
  }

  return updated;
}

/** Mint a fresh invite link for invited or disabled members. */
export async function resendInvite(input: {
  userId: string;
  actorId: string;
  sendEmail?: boolean;
}): Promise<{ inviteUrl: string; email: string; emailSent: boolean }> {
  if (input.userId === input.actorId) {
    throw new Error("You cannot resend an invite to yourself.");
  }

  const target = await getUserById(input.userId);
  if (!target) {
    throw new Error("Member not found.");
  }
  if (target.status === "active") {
    throw new Error("Active members do not need a new invite.");
  }

  const rawToken = generateToken();
  const expiresAt = new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000);

  await db
    .update(users)
    .set({
      status: "invited",
      passwordHash: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, target.id));

  await db.delete(sessions).where(eq(sessions.userId, target.id));
  await invalidateOutstandingInvites(target.id);

  await db.insert(invites).values({
    userId: target.id,
    tokenHash: hashToken(rawToken),
    expiresAt,
  });

  const inviteUrl = `${appBaseUrl()}/invite/${rawToken}`;
  let emailSent = false;
  if (input.sendEmail !== false) {
    try {
      await sendInviteEmail({
        to: target.email,
        name: target.name,
        inviteUrl,
      });
      emailSent = true;
    } catch (error) {
      console.error("[invite] resend email failed; invite still created", error);
    }
  }

  return { inviteUrl, email: target.email, emailSent };
}
