#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

function printHelp() {
  process.stdout.write(`ghostnode

Usage:
  ghostnode scan [--mode audit|redact|block] [--report <file>] -- <command> [args...]
  ghostnode scan <command> [args...]

Examples:
  ghostnode scan -- node server.js
  ghostnode scan --mode redact -- npm start
  ghostnode scan --mode audit --report ghostnode-report.json -- npm run dev
`);
}

function severityRank(value) {
  switch (value) {
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}

function highestSeverity(findings) {
  let highest = "low";
  for (const finding of findings ?? []) {
    if (severityRank(finding.severity) > severityRank(highest)) {
      highest = finding.severity;
    }
  }
  return highest;
}

function buildReport(events) {
  const severityCounts = { high: 0, medium: 0, low: 0 };
  const typeCounts = {};

  for (const event of events) {
    const seenEventSeverities = new Set();
    for (const finding of event.findings ?? []) {
      typeCounts[finding.type] = (typeCounts[finding.type] ?? 0) + 1;
      seenEventSeverities.add(finding.severity ?? "low");
    }
    for (const severity of seenEventSeverities) {
      severityCounts[severity] = (severityCounts[severity] ?? 0) + 1;
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    totalEvents: events.length,
    severityCounts,
    typeCounts,
    events: events.map((event) => ({
      ...event,
      highestSeverity: highestSeverity(event.findings)
    }))
  };
}

function summarize(events) {
  const report = buildReport(events);

  const lines = [];
  lines.push("GhostNode Privacy Scan");
  lines.push("");
  lines.push(`${report.totalEvents} potential leak event(s) detected`);
  lines.push(
    `Severity: HIGH ${report.severityCounts.high} · MEDIUM ${report.severityCounts.medium} · LOW ${report.severityCounts.low}`
  );
  lines.push("");

  for (const event of report.events.slice(0, 10)) {
    const kinds = [...new Set((event.findings ?? []).map((finding) => finding.type))];
    lines.push(
      `${event.action.toUpperCase()} ${event.highestSeverity.toUpperCase()} ${kinds.join(", ")} -> ${event.destination}`
    );
  }

  if (Object.keys(report.typeCounts).length > 0) {
    lines.push("");
    lines.push("Detected types:");
    for (const [type, count] of Object.entries(report.typeCounts)) {
      lines.push(`- ${type}: ${count}`);
    }
  }

  return lines.join("\n");
}

function parseArgs(argv) {
  const args = [...argv];
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    return { help: true };
  }

  const command = args.shift();
  if (command !== "scan") {
    return { error: `Unknown command: ${command}` };
  }

  let mode = "audit";
  let reportPath = null;
  while (args.length > 0) {
    const current = args[0];
    if (current === "--") {
      args.shift();
      break;
    }
    if (current === "--mode") {
      args.shift();
      mode = args.shift() ?? mode;
      continue;
    }
    if (current.startsWith("--mode=")) {
      mode = current.slice("--mode=".length);
      args.shift();
      continue;
    }
    if (current === "--report") {
      args.shift();
      reportPath = args.shift() ?? reportPath;
      continue;
    }
    if (current.startsWith("--report=")) {
      reportPath = current.slice("--report=".length);
      args.shift();
      continue;
    }
    break;
  }

  if (args.length === 0) {
    return { error: "No command provided for scan." };
  }

  return { command: "scan", mode, reportPath, childCommand: args[0], childArgs: args.slice(1) };
}

function shouldUseShell(command) {
  if (process.platform !== "win32") {
    return false;
  }

  if (path.isAbsolute(command)) {
    return false;
  }

  return !/\.(exe|cmd|bat|ps1)$/i.test(command);
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.help) {
    printHelp();
    process.exit(0);
  }
  if (parsed.error) {
    process.stderr.write(`${parsed.error}\n\n`);
    printHelp();
    process.exit(1);
  }

  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const registerPath = pathToFileURL(path.join(moduleDir, "register.js")).href;
  const reportFile = path.join(
    os.tmpdir(),
    `ghostnode-scan-${process.pid}-${Date.now()}.ndjson`
  );

  const nodeOptions = [
    process.env.NODE_OPTIONS,
    `--import=${registerPath}`
  ].filter(Boolean).join(" ");

  const env = {
    ...process.env,
    GHOSTNODE: parsed.mode,
    GHOSTNODE_MODE: parsed.mode,
    GHOSTNODE_REPORT_FILE: reportFile,
    NODE_OPTIONS: nodeOptions
  };

  const child = spawn(parsed.childCommand, parsed.childArgs, {
    stdio: "inherit",
    shell: shouldUseShell(parsed.childCommand),
    env
  });

  const exitCode = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });

  const events = fs.existsSync(reportFile)
    ? fs.readFileSync(reportFile, "utf8")
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => JSON.parse(line))
    : [];

  const report = buildReport(events);

  if (events.length > 0) {
    process.stderr.write(`\n${summarize(events)}\n`);
  } else {
    process.stderr.write("\nGhostNode Privacy Scan\n\nNo leaks detected.\n");
  }

  if (parsed.reportPath) {
    fs.writeFileSync(parsed.reportPath, `${JSON.stringify(report, null, 2)}\n`);
    process.stderr.write(`Report written to ${parsed.reportPath}\n`);
  }

  if (fs.existsSync(reportFile)) {
    fs.unlinkSync(reportFile);
  }

  process.exit(exitCode);
}

main().catch((error) => {
  process.stderr.write(`${error?.stack ?? error}\n`);
  process.exit(1);
});
