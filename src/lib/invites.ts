import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invites, users, type User, type UserRole } from "@/db/schema";
import { generateToken, hashToken } from "@/lib/crypto";
import { appBaseUrl, sendInviteEmail } from "@/lib/mail";

const INVITE_DAYS = 14;

export async function createInviteRecord(input: {
  email: string;
  name: string;
  role?: UserRole;
  sendEmail?: boolean;
}): Promise<{ user: User; inviteUrl: string; rawToken: string }> {
  const email = input.email.trim().toLowerCase();
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existing && existing.status !== "disabled") {
    throw new Error("A user with that email already exists.");
  }

  const [user] =
    existing && existing.status === "disabled"
      ? await db
          .update(users)
          .set({
            name: input.name.trim(),
            role: input.role ?? "member",
            status: "invited",
            passwordHash: null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existing.id))
          .returning()
      : await db
          .insert(users)
          .values({
            email,
            name: input.name.trim(),
            role: input.role ?? "member",
            status: "invited",
          })
          .returning();

  const rawToken = generateToken();
  const expiresAt = new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(invites).values({
    userId: user.id,
    tokenHash: hashToken(rawToken),
    expiresAt,
  });

  const inviteUrl = `${appBaseUrl()}/invite/${rawToken}`;
  if (input.sendEmail !== false) {
    try {
      await sendInviteEmail({ to: user.email, name: user.name, inviteUrl });
    } catch (error) {
      console.error("[invite] email send failed; invite still created", error);
    }
  }

  return { user, inviteUrl, rawToken };
}
