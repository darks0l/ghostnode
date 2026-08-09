import test from "node:test";
import assert from "node:assert/strict";
import { createGhost, ghost, inspect, sanitizeText } from "../src/index.js";

test("ghost redacts sensitive keys recursively", () => {
  const result = ghost({
    email: "john@example.com",
    nested: {
      apiKey: "sk-secret123",
      message: "Hello world"
    },
    items: [
      { password: "hunter2" },
      "Reach me at jane@example.com"
    ]
  });

  assert.deepEqual(result, {
    email: "[REDACTED]",
    nested: {
      apiKey: "[REDACTED]",
      message: "Hello world"
    },
    items: [
      { password: "[REDACTED]" },
      "Reach me at [REDACTED]"
    ]
  });
});

test("ghost preserves cycles while sanitizing data", () => {
  const input = { email: "john@example.com" };
  input.self = input;

  const output = ghost(input);

  assert.equal(output.email, "[REDACTED]");
  assert.equal(output.self, output);
});

test("sanitizeText redacts inline secrets and card-like values", () => {
  const result = sanitizeText(
    "user=john@example.com bearer=Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature card=4242 4242 4242 4242"
  );

  assert.equal(
    result,
    "user=[REDACTED] bearer=[REDACTED] card=[REDACTED]"
  );
});

test("createGhost supports custom secrets and custom keys", () => {
  const sanitize = createGhost({
    sensitiveKeys: ["webhookUrl"],
    secrets: ["project-omega"]
  });

  const result = sanitize({
    webhookUrl: "https://hooks.example.com/secret",
    summary: "Internal codename project-omega should not leak"
  });

  assert.deepEqual(result, {
    webhookUrl: "[REDACTED]",
    summary: "Internal codename [REDACTED] should not leak"
  });
});

test("inspect returns structured findings", () => {
  const result = inspect({
    email: "john@example.com",
    authorization: "Bearer token-value"
  });

  assert.equal(result.value.email, "[REDACTED]");
  assert.equal(result.findings.length >= 2, true);
  assert.equal(result.findings.some((finding) => finding.type === "email"), true);
  assert.equal(result.findings.some((finding) => finding.type === "token"), true);
  assert.equal(result.findings.some((finding) => finding.severity === "medium"), true);
  assert.equal(result.findings.some((finding) => finding.severity === "high"), true);
});
