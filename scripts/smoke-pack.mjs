import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ghostnode-pack-"));
const npmCliArgs = process.env.npm_execpath ? [process.env.npm_execpath] : ["npm"];

function runNpm(args, options = {}) {
  if (npmCliArgs.length === 1 && npmCliArgs[0] === "npm") {
    return execFileSync("npm", args, options);
  }

  return execFileSync(process.execPath, [...npmCliArgs, ...args], options);
}

try {
  const packJson = runNpm(["pack", "--json"], {
    cwd: rootDir,
    encoding: "utf8"
  });
  const [{ filename }] = JSON.parse(packJson);
  const tarballPath = path.join(rootDir, filename);

  runNpm(["init", "-y"], {
    cwd: tempDir,
    stdio: "ignore"
  });
  runNpm(["install", tarballPath], {
    cwd: tempDir,
    stdio: "ignore"
  });

  const smokeCode = `
    import assert from "node:assert/strict";
    import { createPinoLogger, ghost, installGhostNode, sanitizeRequest, uninstallGhostNode } from "ghostnode";

    assert.equal(ghost({ email: "john@example.com" }).email, "[REDACTED]");
    const request = sanitizeRequest("https://api.example.com?token=abc", {
      headers: { authorization: "Bearer token-value" }
    });
    assert.match(request.url, /%5BREDACTED%5D/);
    assert.equal(request.headers.authorization, "[REDACTED]");

    const logger = createPinoLogger({
      info(payload) {
        return payload;
      }
    }, { mode: "redact" });
    assert.deepEqual(logger.info({ token: "secret-token" }), { token: "[REDACTED]" });

    installGhostNode({ mode: "block", console: false, fetch: false });
    uninstallGhostNode();
  `;

  const result = spawnSync(process.execPath, ["--input-type=module", "--eval", smokeCode], {
    cwd: tempDir,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });

  const tarballs = fs.readdirSync(rootDir).filter((entry) => /^ghostnode-.*\.tgz$/.test(entry));
  for (const tarball of tarballs) {
    fs.rmSync(path.join(rootDir, tarball), { force: true });
  }
}
