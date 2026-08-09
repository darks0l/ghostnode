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

const VALUE_PATTERNS = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  /\b(?:[A-F0-9]{0,4}:){2,7}[A-F0-9]{0,4}\b/gi,
  /\bBearer\s+[A-Za-z0-9\-._~+/]+=*\b/gi,
  /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9._-]+\.[A-Za-z0-9._-]+\b/g,
  /\b(?:sk|rk|pk)_(?:live|test)?[A-Za-z0-9_-]{8,}\b/gi,
  /\bsk-[A-Za-z0-9_-]{8,}\b/g
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

function redactCardLikeSequences(text, replacement) {
  return text.replace(/\b(?:\d[ -]*?){13,19}\b/g, (match) => (
    luhnLooksValid(match) ? replacement : match
  ));
}

function redactCustomSecrets(text, options) {
  let output = text;
  for (const custom of toArray(options.secrets)) {
    if (typeof custom === "string" && custom.length > 0) {
      output = output.replace(new RegExp(escapeRegExp(custom), "g"), options.replacement);
      continue;
    }

    if (custom instanceof RegExp) {
      const flags = custom.flags.includes("g") ? custom.flags : `${custom.flags}g`;
      output = output.replace(new RegExp(custom.source, flags), options.replacement);
    }
  }
  return output;
}

function sanitizeString(text, options) {
  let output = redactCustomSecrets(text, options);
  for (const pattern of VALUE_PATTERNS) {
    output = output.replace(pattern, options.replacement);
  }
  output = redactCardLikeSequences(output, options.replacement);
  return output;
}

function sanitizeValue(value, options, seen, currentKey) {
  if (looksSensitiveKey(currentKey, options)) {
    return options.replacement;
  }

  if (typeof value === "string") {
    return sanitizeString(value, options);
  }

  if (value == null || typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    return seen.get(value);
  }

  if (Array.isArray(value)) {
    const clone = [];
    seen.set(value, clone);
    for (const item of value) {
      clone.push(sanitizeValue(item, options, seen));
    }
    return clone;
  }

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (value instanceof Map) {
    const clone = new Map();
    seen.set(value, clone);
    for (const [key, entry] of value.entries()) {
      clone.set(key, sanitizeValue(entry, options, seen, typeof key === "string" ? key : undefined));
    }
    return clone;
  }

  if (value instanceof Set) {
    const clone = new Set();
    seen.set(value, clone);
    for (const entry of value.values()) {
      clone.add(sanitizeValue(entry, options, seen));
    }
    return clone;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const clone = {};
  seen.set(value, clone);
  for (const [key, entry] of Object.entries(value)) {
    clone[key] = sanitizeValue(entry, options, seen, key);
  }
  return clone;
}

export function createGhost(options = {}) {
  const normalized = normalizeOptions(options);
  return function ghostValue(value) {
    return sanitizeValue(value, normalized, new WeakMap());
  };
}

export function ghost(value, options = {}) {
  return createGhost(options)(value);
}

export function sanitizeText(text, options = {}) {
  return sanitizeString(String(text), normalizeOptions(options));
}

export const defaults = {
  replacement: DEFAULT_REPLACEMENT,
  sensitiveKeyPatterns: SENSITIVE_KEY_PATTERNS
};
