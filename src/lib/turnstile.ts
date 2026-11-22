export function turnstileConfigured(): boolean {
  return Boolean(
    process.env.TURNSTILE_SITE_KEY?.trim() &&
      process.env.TURNSTILE_SECRET_KEY?.trim(),
  );
}

export function turnstileSiteKey(): string | null {
  return process.env.TURNSTILE_SITE_KEY?.trim() || null;
}

/** Verify a Cloudflare Turnstile token. No-ops when keys are not configured. */
export async function verifyTurnstileToken(input: {
  token: string;
  remoteip?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!turnstileConfigured()) {
    return { ok: true };
  }

  const token = input.token.trim();
  if (!token) {
    return { ok: false, error: "Please complete the bot check." };
  }

  const body = new URLSearchParams();
  body.set("secret", process.env.TURNSTILE_SECRET_KEY!.trim());
  body.set("response", token);
  if (input.remoteip) body.set("remoteip", input.remoteip);

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
      },
    );
    const payload = (await response.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };
    if (!payload.success) {
      return {
        ok: false,
        error: "Bot check failed. Refresh and try again.",
      };
    }
    return { ok: true };
  } catch (error) {
    console.error("[turnstile] verification request failed", error);
    return {
      ok: false,
      error: "Bot check is temporarily unavailable. Try again shortly.",
    };
  }
}
