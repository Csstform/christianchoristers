export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertSmtpConfiguredForProduction } = await import("@/lib/mail");
    assertSmtpConfiguredForProduction();
  }
}
