import { PublicShell } from "@/components/public-shell";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <PublicShell solidHeader>
      <div className="auth-panel">
        <ForgotPasswordForm />
      </div>
    </PublicShell>
  );
}
