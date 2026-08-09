import fs from "node:fs";
import { installGhostNode } from "./index.js";

const reportFile = process.env.GHOSTNODE_REPORT_FILE;
const mode = process.env.GHOSTNODE_MODE ?? process.env.GHOSTNODE ?? "audit";

function writeEvent(event) {
  if (!reportFile) {
    return;
  }

  fs.appendFileSync(reportFile, `${JSON.stringify({
    timestamp: Date.now(),
    ...event
  })}\n`);
}

installGhostNode({
  mode,
  onEvent(event) {
    writeEvent(event);
  }
});
