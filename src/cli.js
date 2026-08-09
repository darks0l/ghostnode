#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

function printHelp() {
  process.stdout.write(`ghostnode

Usage:
  ghostnode scan [--mode audit|redact|block] -- <command> [args...]
  ghostnode scan <command> [args...]

Examples:
  ghostnode scan -- node server.js
  ghostnode scan --mode redact -- npm start
`);
}

function summarize(events) {
  const counts = new Map();
  for (const event of events) {
    for (const finding of event.findings ?? []) {
      counts.set(finding.type, (counts.get(finding.type) ?? 0) + 1);
    }
  }

  const lines = [];
  lines.push("GhostNode Privacy Scan");
  lines.push("");
  lines.push(`${events.length} potential leak event(s) detected`);
  lines.push("");

  for (const event of events.slice(0, 10)) {
    const kinds = [...new Set((event.findings ?? []).map((finding) => finding.type))];
    lines.push(`${event.action.toUpperCase()} ${kinds.join(", ")} -> ${event.destination}`);
  }

  if (counts.size > 0) {
    lines.push("");
    lines.push("Detected types:");
    for (const [type, count] of counts.entries()) {
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
    break;
  }

  if (args.length === 0) {
    return { error: "No command provided for scan." };
  }

  return { command: "scan", mode, childCommand: args[0], childArgs: args.slice(1) };
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

  if (events.length > 0) {
    process.stderr.write(`\n${summarize(events)}\n`);
  } else {
    process.stderr.write("\nGhostNode Privacy Scan\n\nNo leaks detected.\n");
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
