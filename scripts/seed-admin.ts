import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, sql } from "../src/db";
import { users } from "../src/db/schema";
import { createInviteRecord } from "../src/lib/invites";

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@christianchoristers.com")
    .trim()
    .toLowerCase();
  const name = process.env.SEED_ADMIN_NAME ?? "Site Admin";

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing && existing.status === "active") {
    console.log(`Admin already active: ${email}`);
    process.exit(0);
  }

  if (existing) {
    console.log(`Admin exists (${existing.status}). Mint a fresh invite with: npm run db:mint-invite`);
    process.exit(0);
  }

  // Seed always prints the invite URL; enable SMTP send with SEED_SEND_EMAIL=true
  const { inviteUrl } = await createInviteRecord({
    email,
    name,
    role: "admin",
    sendEmail: process.env.SEED_SEND_EMAIL === "true",
  });

  console.log(`Seeded admin invite for ${email}`);
  console.log(`Invite URL: ${inviteUrl}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await sql.end({ timeout: 5 });
  });
