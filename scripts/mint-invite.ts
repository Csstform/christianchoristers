import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, sql } from "../src/db";
import { invites, users } from "../src/db/schema";
import { generateToken, hashToken } from "../src/lib/crypto";
import { appBaseUrl } from "../src/lib/mail";

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@christianchoristers.com")
    .trim()
    .toLowerCase();
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) {
    throw new Error(`No user for ${email}. Run npm run db:seed first.`);
  }

  const rawToken = generateToken();
  await db.insert(invites).values({
    userId: user.id,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  });

  console.log(`Invite URL for ${email}: ${appBaseUrl()}/invite/${rawToken}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await sql.end({ timeout: 5 });
  });
