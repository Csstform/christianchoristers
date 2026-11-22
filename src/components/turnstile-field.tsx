"use client";

import { useEffect, useId, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad";

export function TurnstileField({ siteKey }: { siteKey: string }) {
  const hostId = useId().replace(/:/g, "");
  const widgetIdRef = useRef<string | null>(null);
  const tokenInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    function setToken(token: string) {
      if (tokenInputRef.current) tokenInputRef.current.value = token;
    }

    function renderWidget() {
      const host = document.getElementById(`turnstile-${hostId}`);
      if (!host || !window.turnstile || cancelled) return;
      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
      host.innerHTML = "";
      widgetIdRef.current = window.turnstile.render(host, {
        sitekey: siteKey,
        theme: "light",
        callback: (token) => setToken(token),
        "expired-callback": () => setToken(""),
        "error-callback": () => setToken(""),
      });
    }

    const previous = window.onTurnstileLoad;
    window.onTurnstileLoad = () => {
      previous?.();
      renderWidget();
    };

    if (window.turnstile) {
      renderWidget();
    } else if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
      if (window.onTurnstileLoad === previous) {
        // keep shared loader callback if another instance owns it
      } else {
        window.onTurnstileLoad = previous;
      }
    };
  }, [hostId, siteKey]);

  return (
    <div className="turnstile-field">
      <input
        ref={tokenInputRef}
        type="hidden"
        name="cf-turnstile-response"
        defaultValue=""
      />
      <div id={`turnstile-${hostId}`} />
    </div>
  );
}
