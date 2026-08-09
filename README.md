# ghostnode

Built by DARKSOL 🌑

<p align="center">
  <img src="https://raw.githubusercontent.com/darks0l/ghostnode/main/assets/darksol-banner.png" alt="DARKSOL banner" width="100%"/>
</p>

`ghostnode` is a privacy firewall for Node.js apps.

It watches outbound boundaries and tells you when sensitive data is about to leave your process.

Think HTTP requests, logs, analytics, telemetry, AI calls, and debug output.

## Install

```bash
npm install ghostnode
```

## Quick Start

```js
import { installGhostNode } from "ghostnode";

installGhostNode({
  mode: "audit",
  onEvent(event) {
    console.error("GhostNode blocked a potential data leak", event);
  }
});
```

Or make it automatic:

```bash
GHOSTNODE=audit node app.js
```

Low-level protection is still available:

```js
import { ghost } from "ghostnode";

const safe = ghost({
  email: "john@example.com",
  ip: "192.168.1.42",
  apiKey: "sk-secret123",
  message: "Hello world"
});

console.log(safe);
```

Output:

```js
{
  email: "[REDACTED]",
  ip: "[REDACTED]",
  apiKey: "[REDACTED]",
  message: "Hello world"
}
```

## Shield Mode

```js
import "ghostnode/shield";

console.log({
  authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature",
  email: "john@example.com"
});
```

That one import patches the standard console methods and sanitizes outgoing log arguments before they are formatted.

## HTTP Edge Protection

```js
import { createFetchProxy } from "ghostnode/http";

const safeFetch = createFetchProxy();

await safeFetch("https://api.example.com/send?email=john@example.com", {
  method: "POST",
  headers: {
    authorization: "Bearer token-value"
  },
  body: JSON.stringify({
    password: "hunter2",
    note: "ship it"
  })
});
```

You can also attach a sanitized request snapshot inside Express-style middleware:

```js
import { createExpressMiddleware } from "ghostnode";

app.use(createExpressMiddleware());
```

## Modes

- `audit`: detect and report leaks, but allow the original operation
- `redact`: sanitize detected data, then allow the operation
- `block`: stop the operation when a leak is detected

Every detection can emit a structured event with:

- boundary
- destination
- findings
- action taken

The promise stays simple:

> GhostNode detects sensitive data leaving your Node.js application.

## What It Redacts

- emails
- IPv4 and IPv6 addresses
- bearer tokens and authorization values
- API keys and secret-like tokens
- JWTs
- cookies
- passwords and passphrases
- card-like values with a Luhn check
- custom secrets and custom sensitive keys

## API

### `ghost(value, options?)`

Returns a sanitized clone of the input value.

Options:

- `replacement`: string used instead of sensitive values. Defaults to `"[REDACTED]"`.
- `sensitiveKeys`: additional keys or regexes that should always redact the full value.
- `secrets`: string or regex secrets that should be scrubbed inline.

### `createGhost(options?)`

Builds a reusable sanitizer with the same options.

### `inspect(value, options?)`

Returns `{ value, findings }` so you can examine what GhostNode detected.

### `installGhostNode(options?)`

Installs runtime boundary protection for `fetch` and `console`.

### `installShield(options?)`

Available from `ghostnode/shield`. Patches console methods and returns a cleanup handle.

## Direction

V1 is intentionally small but already useful.

Next obvious expansions:

- structured logger adapters
- source-aware leak tracing
- telemetry and error reporter integrations
- CLI privacy scan mode

> GhostNode
> Your data was never there.

Built with teeth. 🌑
