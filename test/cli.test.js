import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
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

test("ghostnode scan writes a JSON report with severity counts", () => {
  const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const cliPath = path.join(rootDir, "src", "cli.js");
  const fixturePath = path.join(rootDir, "fixtures", "cli-leak-script.js");
  const reportPath = path.join(os.tmpdir(), `ghostnode-report-${process.pid}-${Date.now()}.json`);

  const result = spawnSync(
    process.execPath,
    [cliPath, "scan", "--mode", "redact", "--report", reportPath, "--", process.execPath, fixturePath],
    {
      cwd: rootDir,
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 0);
  assert.equal(fs.existsSync(reportPath), true);

  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  assert.equal(report.totalEvents >= 1, true);
  assert.equal(report.severityCounts.high >= 1 || report.severityCounts.medium >= 1, true);
  assert.equal(report.events[0].highestSeverity === "high" || report.events[0].highestSeverity === "medium", true);

  fs.unlinkSync(reportPath);
});
