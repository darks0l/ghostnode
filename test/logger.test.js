import test from "node:test";
import assert from "node:assert/strict";
import { createPinoLogger, createSafeLogger, createWinstonLogger } from "../src/index.js";

test("createSafeLogger audit mode reports findings and allows original log", () => {
  const calls = [];
  const events = [];
  const logger = {
    info(...args) {
      calls.push(args);
    }
  };

  const safeLogger = createSafeLogger(logger, {
    mode: "audit",
    onEvent(event) {
      events.push(event);
    }
  });

  safeLogger.info({ email: "john@example.com" });

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0][0], { email: "john@example.com" });
  assert.equal(events.length, 1);
  assert.equal(events[0].boundary, "logger");
  assert.equal(events[0].action, "audit");
  assert.match(events[0].sourceContext.callsite.file, /logger\.test\.js$/);
  assert.equal(typeof events[0].sourceContext.callsite.line, "number");
});

test("createSafeLogger redact mode sanitizes sensitive log args", () => {
  const calls = [];
  const logger = {
    error(...args) {
      calls.push(args);
    }
  };

  const safeLogger = createSafeLogger(logger, { mode: "redact" });
  safeLogger.error({ authorization: "Bearer token-value" }, "email john@example.com");

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0][0], { authorization: "[REDACTED]" });
  assert.equal(calls[0][1], "email [REDACTED]");
});

test("createSafeLogger block mode suppresses leaking logs", () => {
  const calls = [];
  const logger = {
    warn(...args) {
      calls.push(args);
    }
  };

  const safeLogger = createSafeLogger(logger, { mode: "block" });
  safeLogger.warn({ apiKey: "sk-secret123" });

  assert.equal(calls.length, 0);
});

test("createSafeLogger wraps child loggers too", () => {
  const calls = [];
  const child = {
    info(...args) {
      calls.push(args);
    }
  };
  const logger = {
    child() {
      return child;
    }
  };

  const safeLogger = createSafeLogger(logger, { mode: "redact" });
  const safeChild = safeLogger.child({ scope: "demo" });
  safeChild.info({ cookie: "session=abc123" });

  assert.deepEqual(calls[0][0], { cookie: "[REDACTED]" });
});

test("createPinoLogger exposes the same safe logging behavior", () => {
  const calls = [];
  const logger = {
    info(...args) {
      calls.push(args);
    }
  };

  const safeLogger = createPinoLogger(logger, { mode: "redact" });
  safeLogger.info({ authorization: "Bearer token-value" });

  assert.deepEqual(calls[0][0], { authorization: "[REDACTED]" });
});

test("createWinstonLogger exposes the same safe logging behavior", () => {
  const calls = [];
  const logger = {
    warn(...args) {
      calls.push(args);
    }
  };

  const safeLogger = createWinstonLogger(logger, { mode: "redact" });
  safeLogger.warn({ email: "john@example.com" });

  assert.deepEqual(calls[0][0], { email: "[REDACTED]" });
});

test("createSafeLogger can disable source capture for lower-overhead events", () => {
  const events = [];
  const logger = {
    info() {}
  };

  const safeLogger = createSafeLogger(logger, {
    mode: "audit",
    captureSource: false,
    onEvent(event) {
      events.push(event);
    }
  });

  safeLogger.info({ email: "john@example.com" });

  assert.equal(events.length, 1);
  assert.equal("sourceContext" in events[0], false);
});
