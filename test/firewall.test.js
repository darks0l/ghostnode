import test from "node:test";
import assert from "node:assert/strict";
import {
  getActiveGhostNode,
  installGhostNode,
  uninstallGhostNode
} from "../src/index.js";

test.afterEach(() => {
  uninstallGhostNode();
});

test("installGhostNode audit mode reports findings and allows original fetch", async () => {
  const events = [];
  const calls = [];
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return { ok: true, status: 200 };
  };

  installGhostNode({
    mode: "audit",
    fetch: true,
    console: false,
    onEvent(event) {
      events.push(event);
    }
  });

  await globalThis.fetch("https://api.example.com?email=john@example.com", {
    headers: {
      authorization: "Bearer token-value"
    }
  });

  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /john@example.com/);
  assert.equal(events.length, 1);
  assert.equal(events[0].boundary, "fetch");
  assert.equal(events[0].action, "audit");

  globalThis.fetch = originalFetch;
});

test("installGhostNode redact mode sanitizes fetch output before sending", async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return { ok: true, status: 200 };
  };

  installGhostNode({
    mode: "redact",
    fetch: true,
    console: false
  });

  await globalThis.fetch("https://api.example.com?email=john@example.com", {
    headers: {
      authorization: "Bearer token-value"
    }
  });

  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /%5BREDACTED%5D/);
  assert.equal(calls[0].init.headers.authorization, "[REDACTED]");

  globalThis.fetch = originalFetch;
});

test("installGhostNode block mode prevents fetch leaks", async () => {
  const originalFetch = globalThis.fetch;
  let called = false;

  globalThis.fetch = async () => {
    called = true;
    return { ok: true, status: 200 };
  };

  installGhostNode({
    mode: "block",
    fetch: true,
    console: false
  });

  await assert.rejects(
    globalThis.fetch("https://api.example.com?email=john@example.com"),
    /ghostnode blocked potential data leak/i
  );

  assert.equal(called, false);
  globalThis.fetch = originalFetch;
});

test("installGhostNode redact mode sanitizes console output", () => {
  const calls = [];
  const fakeConsole = {
    log(...args) {
      calls.push(args);
    }
  };

  installGhostNode({
    mode: "redact",
    fetch: false,
    console: true,
    consoleTarget: fakeConsole
  });

  fakeConsole.log({ email: "john@example.com" });
  assert.deepEqual(calls[0][0], { email: "[REDACTED]" });
});

test("installGhostNode block mode suppresses console output", () => {
  const calls = [];
  const fakeConsole = {
    log(...args) {
      calls.push(args);
    }
  };

  installGhostNode({
    mode: "block",
    fetch: false,
    console: true,
    consoleTarget: fakeConsole
  });

  fakeConsole.log({ email: "john@example.com" });
  assert.equal(calls.length, 0);
  assert.notEqual(getActiveGhostNode(), null);
});
