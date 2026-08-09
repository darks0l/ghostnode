const DEFAULT_REPLACEMENT = "[REDACTED]";

const SENSITIVE_KEY_PATTERNS = [
  /api[-_ ]?key/i,
  /auth(orization)?/i,
  /bearer/i,
  /card/i,
  /cookie/i,
  /credit/i,
  /email/i,
  /^ip$/i,
  /ipv[46]/i,
  /jwt/i,
  /pass(word|phrase)?/i,
  /secret/i,
  /session/i,
  /ssn/i,
  /token/i
];

const KEY_TYPE_RULES = [
  { pattern: /email/i, type: "email" },
  { pattern: /^ip$|ipv[46]/i, type: "ip" },
  { pattern: /auth(orization)?|bearer|token|jwt|session/i, type: "token" },
  { pattern: /api[-_ ]?key|secret/i, type: "secret" },
  { pattern: /cookie/i, type: "cookie" },
  { pattern: /pass(word|phrase)?/i, type: "password" },
  { pattern: /card|credit/i, type: "card" }
];

const VALUE_RULES = [
  { type: "email", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { type: "ip", pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g },
  { type: "ip", pattern: /\b(?:[A-F0-9]{0,4}:){2,7}[A-F0-9]{0,4}\b/gi },
  { type: "token", pattern: /\bBearer\s+[A-Za-z0-9\-._~+/]+=*\b/gi },
  { type: "jwt", pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9._-]+\.[A-Za-z0-9._-]+\b/g },
  { type: "secret", pattern: /\b(?:sk|rk|pk)_(?:live|test)?[A-Za-z0-9_-]{8,}\b/gi },
  { type: "secret", pattern: /\bsk-[A-Za-z0-9_-]{8,}\b/g }
];

function normalizeOptions(options = {}) {
  return {
    replacement: options.replacement ?? DEFAULT_REPLACEMENT,
    sensitiveKeys: options.sensitiveKeys ?? [],
    secrets: options.secrets ?? []
  };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function previewValue(value) {
  const text = String(value);
  if (text.length <= 12) {
    return text.slice(0, 2) + "***";
  }
  return `${text.slice(0, 4)}***${text.slice(-2)}`;
}

function keyFindingType(key) {
  for (const rule of KEY_TYPE_RULES) {
    if (rule.pattern.test(key)) {
      return rule.type;
    }
  }
  return "sensitive-key";
}

function buildPath(path, segment) {
  if (!segment && segment !== 0) {
    return path;
  }
  if (typeof segment === "number") {
    return `${path}[${segment}]`;
  }
  return path ? `${path}.${segment}` : String(segment);
}

function luhnLooksValid(candidate) {
  const digits = candidate.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

function looksSensitiveKey(key, options) {
  if (typeof key !== "string" || key.length === 0) {
    return false;
  }

  for (const pattern of SENSITIVE_KEY_PATTERNS) {
    if (pattern.test(key)) {
      return true;
    }
  }

  for (const custom of toArray(options.sensitiveKeys)) {
    if (typeof custom === "string" && custom.toLowerCase() === key.toLowerCase()) {
      return true;
    }

    if (custom instanceof RegExp && custom.test(key)) {
      return true;
    }
  }

  return false;
}

function pushFinding(findings, finding) {
  findings.push({
    type: finding.type,
    path: finding.path ?? "",
    source: finding.source ?? "value",
    preview: finding.preview ?? undefined
  });
}

function analyzeString(text, options, path, findings) {
  let output = text;

  for (const custom of toArray(options.secrets)) {
    if (typeof custom === "string" && custom.length > 0) {
      const pattern = new RegExp(escapeRegExp(custom), "g");
      output = output.replace(pattern, (match) => {
        pushFinding(findings, { type: "secret", path, source: "custom-secret", preview: previewValue(match) });
        return options.replacement;
      });
      continue;
    }

    if (custom instanceof RegExp) {
      const flags = custom.flags.includes("g") ? custom.flags : `${custom.flags}g`;
      output = output.replace(new RegExp(custom.source, flags), (match) => {
        pushFinding(findings, { type: "secret", path, source: "custom-secret", preview: previewValue(match) });
        return options.replacement;
      });
    }
  }

  for (const rule of VALUE_RULES) {
    output = output.replace(rule.pattern, (match) => {
      pushFinding(findings, { type: rule.type, path, source: "pattern", preview: previewValue(match) });
      return options.replacement;
    });
  }

  output = output.replace(/\b(?:\d[ -]*?){13,19}\b/g, (match) => {
    if (!luhnLooksValid(match)) {
      return match;
    }
    pushFinding(findings, { type: "card", path, source: "pattern", preview: previewValue(match) });
    return options.replacement;
  });

  return output;
}

function inspectValueInternal(value, options, seen, path = "", currentKey) {
  const findings = [];

  if (looksSensitiveKey(currentKey, options)) {
    pushFinding(findings, {
      type: keyFindingType(String(currentKey)),
      path,
      source: "key",
      preview: value == null ? undefined : previewValue(value)
    });
    return {
      value: options.replacement,
      findings
    };
  }

  if (typeof value === "string") {
    return {
      value: analyzeString(value, options, path, findings),
      findings
    };
  }

  if (value == null || typeof value !== "object") {
    return { value, findings };
  }

  if (seen.has(value)) {
    return { value: seen.get(value), findings };
  }

  if (Array.isArray(value)) {
    const clone = [];
    seen.set(value, clone);
    value.forEach((item, index) => {
      const inspected = inspectValueInternal(item, options, seen, buildPath(path, index));
      clone.push(inspected.value);
      findings.push(...inspected.findings);
    });
    return { value: clone, findings };
  }

  if (value instanceof Date) {
    return { value: new Date(value.getTime()), findings };
  }

  if (value instanceof Map) {
    const clone = new Map();
    seen.set(value, clone);
    for (const [key, entry] of value.entries()) {
      const inspected = inspectValueInternal(entry, options, seen, buildPath(path, key), typeof key === "string" ? key : undefined);
      clone.set(key, inspected.value);
      findings.push(...inspected.findings);
    }
    return { value: clone, findings };
  }

  if (value instanceof Set) {
    const clone = new Set();
    seen.set(value, clone);
    let index = 0;
    for (const entry of value.values()) {
      const inspected = inspectValueInternal(entry, options, seen, buildPath(path, index));
      clone.add(inspected.value);
      findings.push(...inspected.findings);
      index += 1;
    }
    return { value: clone, findings };
  }

  if (!isPlainObject(value)) {
    return { value, findings };
  }

  const clone = {};
  seen.set(value, clone);
  for (const [key, entry] of Object.entries(value)) {
    const inspected = inspectValueInternal(entry, options, seen, buildPath(path, key), key);
    clone[key] = inspected.value;
    findings.push(...inspected.findings);
  }

  return { value: clone, findings };
}

export function inspect(value, options = {}) {
  const normalized = normalizeOptions(options);
  return inspectValueInternal(value, normalized, new WeakMap());
}

export function createGhost(options = {}) {
  return function ghostValue(value) {
    return inspect(value, options).value;
  };
}

export function ghost(value, options = {}) {
  return inspect(value, options).value;
}

export function protect(value, options = {}) {
  return ghost(value, options);
}

export function sanitizeText(text, options = {}) {
  return inspect(String(text), options).value;
}

export const defaults = {
  replacement: DEFAULT_REPLACEMENT,
  sensitiveKeyPatterns: SENSITIVE_KEY_PATTERNS
};
