import fs from "fs";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const electronBin =
  process.platform === "win32"
    ? path.join(rootDir, "node_modules", ".bin", "electron.cmd")
    : path.join(rootDir, "node_modules", ".bin", "electron");

const logFile = path.join(rootDir, ".vault-desk", "launch.log");
const silent = process.env.VAULT_DESK_SILENT === "1";

function log(message) {
  const line = `[${new Date().toLocaleTimeString()}] ${message}\n`;
  if (silent) {
    fs.appendFileSync(logFile, line);
  } else {
    process.stdout.write(line);
  }
}

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

log("Spawning Electron...");

const stdio = silent ? ["ignore", "pipe", "pipe"] : "inherit";
const child = spawn(electronBin, ["."], {
  cwd: rootDir,
  env,
  stdio,
  shell: process.platform === "win32",
});

if (silent && child.stdout && child.stderr) {
  child.stdout.on("data", (chunk) => fs.appendFileSync(logFile, chunk));
  child.stderr.on("data", (chunk) => fs.appendFileSync(logFile, chunk));
}

child.on("exit", (code, signal) => {
  if (code === null) {
    log(`Electron exited with signal ${signal}`);
    process.exit(1);
  }
  log(`Electron exited with code ${code}`);
  process.exit(code);
});
