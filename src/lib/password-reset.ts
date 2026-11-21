import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { passwordResetTokens, sessions, users } from "@/db/schema";
import { generateToken, hashPassword, hashToken } from "@/lib/crypto";
import { appBaseUrl, sendPasswordResetEmail } from "@/lib/mail";
import { createSession } from "@/lib/auth";

const RESET_HOURS = 1;

const GENERIC_REQUEST_MESSAGE =
  "If that email belongs to an active member account, we sent a reset link.";

export async function requestPasswordReset(emailRaw: string): Promise<{
  message: string;
}> {
  const email = emailRaw.trim().toLowerCase();
  if (!email) {
    return { message: GENERIC_REQUEST_MESSAGE };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  // Only active members with an existing password can reset.
  if (!user || user.status !== "active" || !user.passwordHash) {
    return { message: GENERIC_REQUEST_MESSAGE };
  }

  // Invalidate outstanding unused tokens for this user.
  await db
    .update(passwordResetTokens)
    .set({ expiresAt: new Date(0) })
    .where(
      and(
        eq(passwordResetTokens.userId, user.id),
        isNull(passwordResetTokens.usedAt),
      ),
    );

  const rawToken = generateToken();
  const expiresAt = new Date(Date.now() + RESET_HOURS * 60 * 60 * 1000);
  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash: hashToken(rawToken),
    expiresAt,
  });

  const resetUrl = `${appBaseUrl()}/reset-password/${rawToken}`;
  try {
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    });
  } catch (error) {
    console.error("[password-reset] email send failed", error);
    // Still return generic message; token exists for support/retry.
  }

  return { message: GENERIC_REQUEST_MESSAGE };
}

export async function resetPasswordWithToken(input: {
  token: string;
  password: string;
}): Promise<void> {
  if (input.password.length < 10) {
    throw new Error("Password must be at least 10 characters.");
  }

  const tokenHash = hashToken(input.token);
  const row = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(passwordResetTokens.tokenHash, tokenHash),
      isNull(passwordResetTokens.usedAt),
      gt(passwordResetTokens.expiresAt, new Date()),
    ),
  });
  if (!row) {
    throw new Error("Reset link is invalid or expired.");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, row.userId),
  });
  if (!user || user.status !== "active") {
    throw new Error("Reset link is invalid or expired.");
  }

  const passwordHash = await hashPassword(input.password);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, row.id));

  // Kill other outstanding reset tokens for this user.
  await db
    .update(passwordResetTokens)
    .set({ expiresAt: new Date(0) })
    .where(
      and(
        eq(passwordResetTokens.userId, user.id),
        isNull(passwordResetTokens.usedAt),
      ),
    );

  // Force re-auth everywhere, then sign them in with the new password.
  await db.delete(sessions).where(eq(sessions.userId, user.id));
  await createSession(user.id);
}
