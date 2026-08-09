# ghostnode

Built by DARKSOL 🌑

<p align="center">
  <img src="https://raw.githubusercontent.com/darks0l/ghostnode/main/assets/darksol-banner.png" alt="DARKSOL banner" width="100%"/>
</p>

`ghostnode` is a tiny privacy proxy for Node.js apps.

It sits between your code and common leak points so secrets and PII are harder to spill accidentally.

## Install

```bash
npm install ghostnode
```

## Quick Start

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

### `installShield(options?)`

Available from `ghostnode/shield`. Patches console methods and returns a cleanup handle.

## Direction

V1 is intentionally tiny.

Next obvious expansions:

- Express and Fastify middleware
- structured logger adapters
- fetch/request wrappers
- source-aware leak tracing
- telemetry and error reporter integrations

> GhostNode
> Your data was never there.

Built with teeth. 🌑
