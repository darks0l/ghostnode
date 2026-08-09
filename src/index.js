import { getActiveGhostNode, installGhostNode } from "./firewall.js";

export { createGhost, defaults, ghost, inspect, protect, sanitizeText, severityForType } from "./core.js";
export {
  createExpressMiddleware,
  createFetchProxy,
  inspectRequest,
  sanitizeHeaders,
  sanitizeRequest
} from "./http.js";
export { createPinoLogger, createSafeLogger, createWinstonLogger } from "./logger.js";
export { getActiveGhostNode, installGhostNode, uninstallGhostNode } from "./firewall.js";

const envMode = process.env.GHOSTNODE;
if (envMode && !getActiveGhostNode()) {
  installGhostNode({ mode: envMode });
}
