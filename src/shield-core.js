import { createGhost } from "./core.js";

const CONSOLE_METHODS = [
  "debug",
  "dir",
  "error",
  "info",
  "log",
  "trace",
  "warn"
];

let activeShield = null;

function sanitizeArgs(args, ghost) {
  return args.map((argument) => ghost(argument));
}

export function installShield(options = {}) {
  const targetConsole = options.consoleTarget ?? console;
  const ghost = createGhost(options);
  const originals = new Map();

  for (const method of CONSOLE_METHODS) {
    if (typeof targetConsole[method] !== "function") {
      continue;
    }

    const original = targetConsole[method];
    originals.set(method, original);

    targetConsole[method] = function ghostShieldPatched(...args) {
      return original.apply(targetConsole, sanitizeArgs(args, ghost));
    };
  }

  const cleanup = {
    uninstall() {
      for (const [method, original] of originals.entries()) {
        targetConsole[method] = original;
      }

      if (activeShield === cleanup) {
        activeShield = null;
      }
    }
  };

  activeShield = cleanup;
  return cleanup;
}

export function uninstallShield() {
  activeShield?.uninstall();
}

export function configureShield(options = {}) {
  uninstallShield();
  return installShield(options);
}

export function getActiveShield() {
  return activeShield;
}
