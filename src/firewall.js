import { inspect } from "./core.js";
import { inspectRequest } from "./http.js";
import { captureSourceContext } from "./source-context.js";

const CONSOLE_METHODS = ["debug", "dir", "error", "info", "log", "trace", "warn"];

let activeFirewall = null;

function normalizeMode(mode) {
  return mode === "audit" || mode === "redact" || mode === "block" ? mode : "audit";
}

function createLeakError(event) {
  const destination = event.destination ?? event.boundary;
  const summary = event.findings.map((finding) => finding.type).join(", ");
  return new Error(`ghostnode blocked potential data leak to ${destination}: ${summary}`);
}

function dedupeFindings(findings) {
  const seen = new Set();
  return findings.filter((finding) => {
    const key = `${finding.type}:${finding.path}:${finding.source}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function emitEvent(onEvent, event) {
  if (typeof onEvent === "function") {
    return onEvent(event);
  }
}

function withSourceContext(event, options) {
  if (options.captureSource === false) {
    return event;
  }

  return {
    ...event,
    sourceContext: captureSourceContext()
  };
}

function inspectConsoleArgs(args, options) {
  const findings = [];
  const values = args.map((argument, index) => {
    const inspected = inspect(argument, options);
    findings.push(...inspected.findings.map((finding) => ({
      ...finding,
      path: finding.path ? `args[${index}].${finding.path}` : `args[${index}]`
    })));
    return inspected.value;
  });

  return {
    sanitizedArgs: values,
    findings: dedupeFindings(findings)
  };
}

function installConsoleFirewall(options) {
  const targetConsole = options.consoleTarget ?? console;
  const originals = new Map();

  for (const method of CONSOLE_METHODS) {
    if (typeof targetConsole[method] !== "function") {
      continue;
    }

    const original = targetConsole[method];
    originals.set(method, original);

    targetConsole[method] = function ghostnodeConsoleFirewall(...args) {
      const inspected = inspectConsoleArgs(args, options);
      if (inspected.findings.length > 0) {
        const event = {
          boundary: "console",
          method,
          destination: `console.${method}`,
          findings: inspected.findings,
          action: options.mode
        };
        emitEvent(options.onEvent, withSourceContext(event, options));

        if (options.mode === "block") {
          return;
        }

        if (options.mode === "redact") {
          return original.apply(targetConsole, inspected.sanitizedArgs);
        }
      }

      return original.apply(targetConsole, args);
    };
  }

  return () => {
    for (const [method, original] of originals.entries()) {
      targetConsole[method] = original;
    }
  };
}

function installFetchFirewall(options) {
  const fetchImpl = typeof options.fetch === "function" ? options.fetch : globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    return () => {};
  }

  globalThis.fetch = async function ghostnodeFetchFirewall(input, init = {}) {
    const inspected = inspectRequest(input, init, options);

    if (inspected.findings.length > 0) {
      const event = {
        boundary: "fetch",
        destination: inspected.destination,
        findings: dedupeFindings(inspected.findings),
        action: options.mode
      };
      await emitEvent(options.onEvent, withSourceContext(event, options));

      if (options.mode === "block") {
        throw createLeakError(event);
      }

      if (options.mode === "redact") {
        return fetchImpl(inspected.url, {
          ...init,
          method: inspected.method,
          headers: inspected.headers,
          body: inspected.body
        });
      }
    }

    return fetchImpl(input, init);
  };

  return () => {
    globalThis.fetch = fetchImpl;
  };
}

export function installGhostNode(options = {}) {
  activeFirewall?.uninstall();

  const normalized = {
    ...options,
    mode: normalizeMode(options.mode)
  };

  const uninstallers = [];
  if (options.fetch !== false) {
    uninstallers.push(installFetchFirewall(normalized));
  }
  if (options.console !== false) {
    uninstallers.push(installConsoleFirewall(normalized));
  }

  const cleanup = {
    uninstall() {
      while (uninstallers.length > 0) {
        uninstallers.pop()();
      }
      if (activeFirewall === cleanup) {
        activeFirewall = null;
      }
    }
  };

  activeFirewall = cleanup;
  return cleanup;
}

export function uninstallGhostNode() {
  activeFirewall?.uninstall();
}

export function getActiveGhostNode() {
  return activeFirewall;
}
