import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { __resetResendClientForTests, sendEmail } from "./index";

/**
 * Unit tests for the `lib/email/index.ts` Resend provider wrapper
 * per [ADR-0021](../../docs/adr/0021-subscriber-list-email.md) D-A
 * provider-isolation contract.
 *
 * Test strategy:
 *   - Stub the `resend` SDK via `vi.mock` + `vi.hoisted`. The
 *     wrapper exists to provide a provider-agnostic surface; tests
 *     validate the wrapper's behavior, not the SDK's.
 *   - `Resend` is a class — the mock is a class shape with a
 *     constructor counter to test client caching across calls.
 *   - Reset env vars + cached client between tests so each `it`
 *     starts from a clean slate (prevents cross-test bleed).
 *   - Cover the structured failure cases (missing API key, missing
 *     from, provider error) + happy path.
 */

const { mockSend, mockState } = vi.hoisted(() => ({
  mockSend: vi.fn(),
  mockState: { constructorCalls: 0 },
}));

vi.mock("resend", () => ({
  Resend: class MockResend {
    emails = { send: mockSend };
    constructor() {
      mockState.constructorCalls++;
    }
  },
}));

describe("sendEmail — graceful degradation", () => {
  beforeEach(() => {
    __resetResendClientForTests();
    delete process.env["RESEND_API_KEY"];
    delete process.env["EMAIL_FROM"];
    mockSend.mockReset();
    mockState.constructorCalls = 0;
  });

  afterEach(() => {
    delete process.env["RESEND_API_KEY"];
    delete process.env["EMAIL_FROM"];
  });

  it("returns missing_api_key when RESEND_API_KEY is unset (ADR-0021 D-G graceful degradation)", async () => {
    const result = await sendEmail("user@example.com", "Subject", "<p>body</p>");
    expect(result).toEqual({ ok: false, error: "missing_api_key" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("returns missing_from when EMAIL_FROM is unset even with API key present", async () => {
    process.env["RESEND_API_KEY"] = "re_test_123";
    const result = await sendEmail("user@example.com", "Subject", "<p>body</p>");
    expect(result).toEqual({ ok: false, error: "missing_from" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("uses options.from override when provided (skips EMAIL_FROM lookup)", async () => {
    process.env["RESEND_API_KEY"] = "re_test_123";
    mockSend.mockResolvedValueOnce({ data: { id: "msg_456" }, error: null });
    const result = await sendEmail("user@example.com", "Subject", "<p>body</p>", {
      from: "Override <override@example.com>",
    });
    expect(result).toEqual({ ok: true, id: "msg_456" });
    expect(mockSend).toHaveBeenCalledWith({
      from: "Override <override@example.com>",
      to: "user@example.com",
      subject: "Subject",
      html: "<p>body</p>",
    });
  });
});

describe("sendEmail — happy path + provider errors (mocked SDK)", () => {
  beforeEach(() => {
    __resetResendClientForTests();
    process.env["RESEND_API_KEY"] = "re_test_123";
    process.env["EMAIL_FROM"] = "LLM OpenProblems <digest@example.com>";
    mockSend.mockReset();
    mockState.constructorCalls = 0;
  });

  afterEach(() => {
    delete process.env["RESEND_API_KEY"];
    delete process.env["EMAIL_FROM"];
  });

  it("returns ok with message id on successful send", async () => {
    mockSend.mockResolvedValueOnce({ data: { id: "msg_abc" }, error: null });
    const result = await sendEmail("user@example.com", "Subject", "<p>body</p>");
    expect(result).toEqual({ ok: true, id: "msg_abc" });
    expect(mockSend).toHaveBeenCalledWith({
      from: "LLM OpenProblems <digest@example.com>",
      to: "user@example.com",
      subject: "Subject",
      html: "<p>body</p>",
    });
  });

  it("returns ok with empty id when SDK returns no id (defensive)", async () => {
    mockSend.mockResolvedValueOnce({ data: null, error: null });
    const result = await sendEmail("user@example.com", "Subject", "<p>body</p>");
    expect(result).toEqual({ ok: true, id: "" });
  });

  it("returns provider_error when SDK returns an error object", async () => {
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { name: "validation_error", message: "Invalid recipient" },
    });
    const result = await sendEmail("user@example.com", "Subject", "<p>body</p>");
    expect(result).toEqual({
      ok: false,
      error: "provider_error",
      message: "Invalid recipient",
    });
  });

  it("returns provider_error when SDK throws", async () => {
    mockSend.mockRejectedValueOnce(new Error("Network timeout"));
    const result = await sendEmail("user@example.com", "Subject", "<p>body</p>");
    expect(result).toEqual({
      ok: false,
      error: "provider_error",
      message: "Network timeout",
    });
  });

  it("returns provider_error with string fallback when SDK throws non-Error", async () => {
    mockSend.mockRejectedValueOnce("string-only error");
    const result = await sendEmail("user@example.com", "Subject", "<p>body</p>");
    expect(result).toEqual({
      ok: false,
      error: "provider_error",
      message: "string-only error",
    });
  });
});

describe("sendEmail — client caching across calls", () => {
  beforeEach(() => {
    __resetResendClientForTests();
    process.env["RESEND_API_KEY"] = "re_test_123";
    process.env["EMAIL_FROM"] = "LLM OpenProblems <digest@example.com>";
    mockSend.mockReset();
    mockState.constructorCalls = 0;
  });

  afterEach(() => {
    delete process.env["RESEND_API_KEY"];
    delete process.env["EMAIL_FROM"];
  });

  it("reuses the Resend client across multiple sends (perf — no per-call init)", async () => {
    mockSend.mockResolvedValue({ data: { id: "msg_x" }, error: null });
    await sendEmail("a@example.com", "S1", "<p>1</p>");
    await sendEmail("b@example.com", "S2", "<p>2</p>");
    await sendEmail("c@example.com", "S3", "<p>3</p>");
    // Constructor invoked exactly once across the 3 send calls.
    expect(mockState.constructorCalls).toBe(1);
    expect(mockSend).toHaveBeenCalledTimes(3);
  });
});
