import test from "node:test";
import assert from "node:assert/strict";
import {
  createExpressMiddleware,
  createFetchProxy,
  sanitizeHeaders,
  sanitizeRequest
} from "../src/index.js";

test("sanitizeHeaders redacts sensitive header values", () => {
  const result = sanitizeHeaders({
    authorization: "Bearer top-secret-token",
    cookie: "session=abc123",
    "x-trace-id": "trace-ok"
  });

  assert.deepEqual(result, {
    authorization: "[REDACTED]",
    cookie: "[REDACTED]",
    "x-trace-id": "trace-ok"
  });
});

test("sanitizeRequest redacts query params, headers, and JSON-like bodies", () => {
  const result = sanitizeRequest(
    "https://example.com/send?email=john@example.com&trace=ok",
    {
      method: "POST",
      headers: {
        authorization: "Bearer token-value"
      },
      body: {
        password: "hunter2",
        note: "email jane@example.com"
      }
    }
  );

  assert.equal(result.method, "POST");
  assert.match(result.url, /email=%5BREDACTED%5D/);
  assert.equal(result.headers.authorization, "[REDACTED]");
  assert.deepEqual(result.body, {
    password: "[REDACTED]",
    note: "email [REDACTED]"
  });
});

test("createFetchProxy sanitizes outbound request before handoff", async () => {
  const calls = [];
  const ghostFetch = createFetchProxy({
    fetch: async (url, init) => {
      calls.push({ url, init });
      return { ok: true, status: 200 };
    }
  });

  await ghostFetch("https://example.com/?token=sk-secret123", {
    method: "POST",
    headers: {
      authorization: "Bearer token-value"
    },
    body: JSON.stringify({
      email: "john@example.com"
    })
  });

  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /token=%5BREDACTED%5D/);
  assert.equal(calls[0].init.headers.authorization, "[REDACTED]");
  assert.equal(calls[0].init.body, "{\"email\":\"[REDACTED]\"}");
});

test("createExpressMiddleware attaches sanitized request snapshots", () => {
  const middleware = createExpressMiddleware();
  const req = {
    headers: { cookie: "session=abc123" },
    body: { apiKey: "sk-secret123" },
    query: { email: "john@example.com" },
    params: { userId: "42" },
    ip: "192.168.1.42",
    originalUrl: "/users?email=john@example.com"
  };

  let nextCalled = false;
  middleware(req, {}, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(typeof req.ghost, "function");
  assert.deepEqual(req.ghostSafe.headers, { cookie: "[REDACTED]" });
  assert.deepEqual(req.ghostSafe.body, { apiKey: "[REDACTED]" });
  assert.deepEqual(req.ghostSafe.query, { email: "[REDACTED]" });
  assert.equal(req.ghostSafe.ip, "[REDACTED]");
  assert.match(req.ghostSafe.url, /\[REDACTED\]/);
});
