import { PublicShell } from "@/components/public-shell";
import { LoginForm } from "@/components/login-form";
import { safeAppPath } from "@/lib/paths";
import { turnstileSiteKey } from "@/lib/turnstile";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = safeAppPath(params.next);

  return (
    <PublicShell solidHeader>
      <div className="auth-panel auth-panel--centered">
        <LoginForm next={next} turnstileSiteKey={turnstileSiteKey()} />
      </div>
    </PublicShell>
  );
}
