import { createGhost, inspect, sanitizeText } from "./core.js";

function isHeadersInstance(value) {
  return typeof Headers !== "undefined" && value instanceof Headers;
}

function cloneHeaders(headers) {
  if (!headers) {
    return {};
  }

  if (isHeadersInstance(headers)) {
    return Object.fromEntries(headers.entries());
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  return { ...headers };
}

function inspectQueryParams(url, options) {
  try {
    const parsed = new URL(String(url));
    const findings = [];
    for (const [key, value] of parsed.searchParams.entries()) {
      const inspected = inspect({ [key]: value }, options);
      findings.push(...inspected.findings.map((finding) => ({
        ...finding,
        path: finding.path.replace(/^\w+\./, "query.")
      })));
      parsed.searchParams.set(key, inspected.value[key]);
    }
    return { value: parsed.toString(), findings };
  } catch {
    return inspect(String(url), options);
  }
}

function inspectBody(body, options) {
  if (body == null) {
    return { value: body, findings: [] };
  }

  if (typeof body === "string") {
    try {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed === "object") {
        const inspected = inspect(parsed, options);
        return {
          value: JSON.stringify(inspected.value),
          findings: inspected.findings.map((finding) => ({
            ...finding,
            path: finding.path ? `body.${finding.path}` : "body"
          }))
        };
      }
    } catch {
      // Fall through to plain-text inspection.
    }
    return inspect(body, options);
  }

  if (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams) {
    const params = new URLSearchParams(body);
    const findings = [];
    for (const [key, value] of params.entries()) {
      const inspected = inspect({ [key]: value }, options);
      findings.push(...inspected.findings.map((finding) => ({
        ...finding,
        path: finding.path.replace(/^\w+\./, "body.")
      })));
      params.set(key, inspected.value[key]);
    }
    return { value: params, findings };
  }

  if (typeof FormData !== "undefined" && body instanceof FormData) {
    const form = new FormData();
    const findings = [];
    for (const [key, value] of body.entries()) {
      if (typeof value === "string") {
        const inspected = inspect({ [key]: value }, options);
        findings.push(...inspected.findings.map((finding) => ({
          ...finding,
          path: finding.path.replace(/^\w+\./, "body.")
        })));
        form.append(key, inspected.value[key]);
      } else {
        form.append(key, value);
      }
    }
    return { value: form, findings };
  }

  if (typeof body === "object" && !(body instanceof ArrayBuffer) && !ArrayBuffer.isView(body)) {
    const inspected = inspect(body, options);
    return {
      value: inspected.value,
      findings: inspected.findings.map((finding) => ({
        ...finding,
        path: finding.path ? `body.${finding.path}` : "body"
      }))
    };
  }

  return { value: body, findings: [] };
}

function normalizeRequest(input, init = {}) {
  if (typeof Request !== "undefined" && input instanceof Request) {
    return {
      url: input.url,
      method: init.method ?? input.method,
      headers: init.headers ?? cloneHeaders(input.headers),
      body: init.body
    };
  }

  return {
    url: String(input),
    method: init.method ?? "GET",
    headers: init.headers,
    body: init.body
  };
}

export function sanitizeHeaders(headers, options = {}) {
  return inspect(cloneHeaders(headers), options).value;
}

export function sanitizeRequest(input, init = {}, options = {}) {
  const normalized = normalizeRequest(input, init);
  const url = inspectQueryParams(normalized.url, options);
  const headers = inspect(cloneHeaders(normalized.headers), options);
  const body = inspectBody(normalized.body, options);

  return {
    method: normalized.method,
    url: url.value,
    headers: headers.value,
    body: body.value
  };
}

export function inspectRequest(input, init = {}, options = {}) {
  const normalized = normalizeRequest(input, init);
  const url = inspectQueryParams(normalized.url, options);
  const headers = inspect(cloneHeaders(normalized.headers), options);
  const body = inspectBody(normalized.body, options);

  return {
    method: normalized.method,
    url: url.value,
    headers: headers.value,
    body: body.value,
    destination: normalized.url,
    findings: [...url.findings, ...headers.findings, ...body.findings]
  };
}

export function createFetchProxy(options = {}) {
  const fetchImpl = typeof options.fetch === "function" ? options.fetch : globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    throw new Error("ghostnode: no fetch implementation available");
  }

  return async function ghostFetch(input, init = {}) {
    const inspected = inspectRequest(input, init, options);

    if (typeof options.onRequest === "function") {
      await options.onRequest(inspected);
    }

    return fetchImpl(inspected.url, {
      ...init,
      method: inspected.method,
      headers: inspected.headers,
      body: inspected.body
    });
  };
}

export function createExpressMiddleware(options = {}) {
  const ghost = createGhost(options);
  return function ghostnodeMiddleware(req, _res, next) {
    req.ghost = ghost;
    req.ghostSafe = {
      headers: sanitizeHeaders(req.headers, options),
      body: ghost(req.body),
      query: ghost(req.query),
      params: ghost(req.params),
      ip: req.ip ? sanitizeText(String(req.ip), options) : req.ip,
      url: req.originalUrl ? sanitizeText(String(req.originalUrl), options) : req.originalUrl
    };
    next();
  };
}
