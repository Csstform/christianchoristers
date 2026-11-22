import { PublicShell } from "@/components/public-shell";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { turnstileSiteKey } from "@/lib/turnstile";

export default function ForgotPasswordPage() {
  return (
    <PublicShell solidHeader>
      <div className="auth-panel">
        <ForgotPasswordForm turnstileSiteKey={turnstileSiteKey()} />
      </div>
    </PublicShell>
  );
}
