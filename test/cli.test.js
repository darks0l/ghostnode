import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

test("ghostnode scan reports leak findings for a child script", () => {
  const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const cliPath = path.join(rootDir, "src", "cli.js");
  const fixturePath = path.join(rootDir, "fixtures", "cli-leak-script.js");

  const result = spawnSync(
    process.execPath,
    [cliPath, "scan", "--mode", "redact", "--", process.execPath, fixturePath],
    {
      cwd: rootDir,
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 0);
  assert.match(result.stderr, /GhostNode Privacy Scan/);
  assert.match(result.stderr, /REDACT/);
  assert.match(result.stderr, /console\.log/);
});
