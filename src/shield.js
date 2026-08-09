import { configureShield, getActiveShield, installShield, uninstallShield } from "./shield-core.js";

if (!getActiveShield()) {
  installShield();
}

export { configureShield, getActiveShield, installShield, uninstallShield } from "./shield-core.js";
