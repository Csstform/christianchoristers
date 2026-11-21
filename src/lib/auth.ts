import { cookies } from "next/headers";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { invites, sessions, users, type User } from "@/db/schema";
import {
  generateToken,
  hashPassword,
  hashToken,
  verifyPassword,
} from "@/lib/crypto";
import { createInviteRecord } from "@/lib/invites";
import type { UserRole } from "@/db/schema";

const SESSION_COOKIE = "cc_session";
const SESSION_DAYS = 30;

export type SessionUser = Pick<
  User,
  "id" | "email" | "name" | "role" | "status"
>;

function sessionExpiry(): Date {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

export async function createInvite(input: {
  email: string;
  name: string;
  role?: UserRole;
}): Promise<{ user: User; inviteUrl: string; rawToken: string }> {
  return createInviteRecord(input);
}

export async function acceptInvite(input: {
  token: string;
  password: string;
}): Promise<SessionUser> {
  if (input.password.length < 10) {
    throw new Error("Password must be at least 10 characters.");
  }

  const tokenHash = hashToken(input.token);
  const invite = await db.query.invites.findFirst({
    where: and(
      eq(invites.tokenHash, tokenHash),
      isNull(invites.acceptedAt),
      gt(invites.expiresAt, new Date()),
    ),
  });
  if (!invite) {
    throw new Error("Invite is invalid or expired.");
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.id, invite.userId),
  });
  if (!existing || existing.status === "disabled") {
    throw new Error("Invite is invalid or expired.");
  }
  if (existing.status !== "invited") {
    throw new Error("Invite is invalid or expired.");
  }

  const passwordHash = await hashPassword(input.password);
  const [user] = await db
    .update(users)
    .set({
      passwordHash,
      status: "active",
      updatedAt: new Date(),
    })
    .where(and(eq(users.id, invite.userId), eq(users.status, "invited")))
    .returning();

  if (!user) {
    throw new Error("Invite is invalid or expired.");
  }

  await db
    .update(invites)
    .set({ acceptedAt: new Date() })
    .where(eq(invites.id, invite.id));

  await createSession(user.id);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
  };
}

export async function loginWithPassword(input: {
  email: string;
  password: string;
}): Promise<SessionUser> {
  const email = input.email.trim().toLowerCase();
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (!user || user.status !== "active" || !user.passwordHash) {
    throw new Error("Invalid email or password.");
  }
  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) {
    throw new Error("Invalid email or password.");
  }
  await createSession(user.id);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
  };
}

export async function createSession(userId: string): Promise<void> {
  const rawToken = generateToken();
  await db.insert(sessions).values({
    userId,
    tokenHash: hashToken(rawToken),
    expiresAt: sessionExpiry(),
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: sessionExpiry(),
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (raw) {
    await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(raw)));
  }
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const row = await db.query.sessions.findFirst({
    where: and(
      eq(sessions.tokenHash, hashToken(raw)),
      gt(sessions.expiresAt, new Date()),
    ),
  });
  if (!row) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, row.userId),
  });
  if (!user || user.status !== "active") return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
