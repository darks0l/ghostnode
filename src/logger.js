import { inspect } from "./core.js";

const LOGGER_METHODS = ["fatal", "error", "warn", "info", "log", "debug", "trace"];

function normalizeMode(mode) {
  return mode === "audit" || mode === "redact" || mode === "block" ? mode : "audit";
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

function inspectLoggerArgs(args, options) {
  const findings = [];
  const sanitizedArgs = args.map((argument, index) => {
    const inspected = inspect(argument, options);
    findings.push(...inspected.findings.map((finding) => ({
      ...finding,
      path: finding.path ? `args[${index}].${finding.path}` : `args[${index}]`
    })));
    return inspected.value;
  });

  return {
    sanitizedArgs,
    findings: dedupeFindings(findings)
  };
}

function emitEvent(onEvent, event) {
  if (typeof onEvent === "function") {
    return onEvent(event);
  }
}

export function createSafeLogger(targetLogger, options = {}) {
  if (!targetLogger || typeof targetLogger !== "object") {
    throw new Error("ghostnode: createSafeLogger requires a logger object");
  }

  const mode = normalizeMode(options.mode);

  const proxy = {};
  for (const key of Reflect.ownKeys(targetLogger)) {
    if (!LOGGER_METHODS.includes(String(key))) {
      continue;
    }

    const original = targetLogger[key];
    if (typeof original !== "function") {
      continue;
    }

    proxy[key] = function ghostnodeSafeLogger(...args) {
      const inspected = inspectLoggerArgs(args, options);
      if (inspected.findings.length > 0) {
        const event = {
          boundary: "logger",
          method: String(key),
          destination: `logger.${String(key)}`,
          findings: inspected.findings,
          action: mode
        };
        emitEvent(options.onEvent, event);

        if (mode === "block") {
          return;
        }

        if (mode === "redact") {
          return original.apply(targetLogger, inspected.sanitizedArgs);
        }
      }

      return original.apply(targetLogger, args);
    };
  }

  if (typeof targetLogger.child === "function") {
    proxy.child = function ghostnodeLoggerChild(...args) {
      const childLogger = targetLogger.child.apply(targetLogger, args);
      return createSafeLogger(childLogger, options);
    };
  }

  return new Proxy(targetLogger, {
    get(target, property, receiver) {
      if (property in proxy) {
        return proxy[property];
      }

      const value = Reflect.get(target, property, receiver);
      if (typeof value === "function") {
        return value.bind(target);
      }
      return value;
    }
  });
}
