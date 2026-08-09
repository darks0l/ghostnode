import test from "node:test";
import assert from "node:assert/strict";
import { configureShield, uninstallShield } from "../src/shield-core.js";

test("installShield sanitizes console output arguments", () => {
  const calls = [];
  const fakeConsole = {
    log(...args) {
      calls.push(args);
    },
    error(...args) {
      calls.push(args);
    }
  };

  const shield = configureShield({ consoleTarget: fakeConsole });

  fakeConsole.log({
    authorization: "Bearer token-value",
    email: "john@example.com"
  });

  fakeConsole.error("debug jane@example.com sk-secret123");
  shield.uninstall();

  assert.deepEqual(calls[0][0], {
    authorization: "[REDACTED]",
    email: "[REDACTED]"
  });
  assert.equal(calls[1][0], "debug [REDACTED] [REDACTED]");
});

test("uninstallShield restores console methods", () => {
  const fakeConsole = {
    warn() {
      return "original";
    }
  };

  const original = fakeConsole.warn;
  configureShield({ consoleTarget: fakeConsole });
  uninstallShield();

  assert.equal(fakeConsole.warn, original);
});
