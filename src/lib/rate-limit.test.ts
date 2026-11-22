import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clientKeyFromHeaders } from "@/lib/rate-limit";

describe("clientKeyFromHeaders", () => {
  it("prefers CF-Connecting-IP over spoofable X-Forwarded-For", () => {
    const headers = new Headers({
      "cf-connecting-ip": "203.0.113.10",
      "x-forwarded-for": "198.51.100.1, 203.0.113.10",
      "x-real-ip": "203.0.113.99",
    });
    assert.equal(clientKeyFromHeaders(headers), "203.0.113.10");
  });

  it("uses X-Real-IP when CF header is absent", () => {
    const headers = new Headers({
      "x-real-ip": "203.0.113.20",
      "x-forwarded-for": "198.51.100.1, 203.0.113.20",
    });
    assert.equal(clientKeyFromHeaders(headers), "203.0.113.20");
  });

  it("uses the last X-Forwarded-For hop, not the first", () => {
    const headers = new Headers({
      "x-forwarded-for": "198.51.100.1, 203.0.113.30",
    });
    assert.equal(clientKeyFromHeaders(headers), "203.0.113.30");
  });

  it("falls back when no proxy headers are present", () => {
    assert.equal(clientKeyFromHeaders(new Headers()), "unknown");
  });
});
