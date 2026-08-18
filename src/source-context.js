import path from "node:path";
import { fileURLToPath } from "node:url";

const INTERNAL_FILE_NAMES = [
  "/src/firewall.js",
  "\\src\\firewall.js",
  "/src/logger.js",
  "\\src\\logger.js",
  "/src/source-context.js",
  "\\src\\source-context.js"
];

function normalizeFilePath(file) {
  if (!file) {
    return null;
  }

  if (file.startsWith("file://")) {
    try {
      return fileURLToPath(file);
    } catch {
      return file;
    }
  }

  return file;
}

function parseStackLine(line) {
  const trimmed = line.trim();
  const withFrame = /^at\s+(?<frame>.+?)\s+\((?<file>.+):(?<line>\d+):(?<column>\d+)\)$/;
  const bare = /^at\s+(?<file>.+):(?<line>\d+):(?<column>\d+)$/;
  const match = trimmed.match(withFrame) ?? trimmed.match(bare);

  if (!match?.groups) {
    return null;
  }

  const file = normalizeFilePath(match.groups.file);
  if (!file) {
    return null;
  }

  return {
    frame: match.groups.frame ?? null,
    file,
    line: Number(match.groups.line),
    column: Number(match.groups.column)
  };
}

function isInternalFrame(frame) {
  return INTERNAL_FILE_NAMES.some((fragment) => frame.file.includes(fragment));
}

function normalizeDisplayPath(file) {
  const cwd = process.cwd();
  const relative = path.relative(cwd, file);
  const display = relative && !relative.startsWith("..") && !path.isAbsolute(relative)
    ? relative
    : file;
  return display.replace(/\\/g, "/");
}

function summarizeCallsite(callsite) {
  if (!callsite) {
    return null;
  }

  const file = normalizeDisplayPath(callsite.file);
  const label = `${file}:${callsite.line}:${callsite.column}`;

  return {
    file,
    line: callsite.line,
    column: callsite.column,
    frame: callsite.frame,
    label
  };
}

export function captureSourceContext() {
  const stack = new Error().stack;
  if (!stack) {
    return null;
  }

  const frames = stack
    .split(/\r?\n/)
    .slice(1)
    .map(parseStackLine)
    .filter(Boolean);

  const callsite = frames.find((frame) => !isInternalFrame(frame));
  if (!callsite) {
    return null;
  }

  return {
    callsite,
    stack: frames,
    summary: summarizeCallsite(callsite)
  };
}
