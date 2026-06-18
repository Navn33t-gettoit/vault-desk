import { spawn } from "child_process";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { APP_HOST, APP_PORT, APP_URL } from "../app.config.mjs";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/** @type {import("child_process").ChildProcess | null} */
let serverProcess = null;

export function isServerRunning() {
  return new Promise((resolve) => {
    const request = http.get(APP_URL, (response) => {
      response.resume();
      resolve(true);
    });
    request.on("error", () => resolve(false));
    request.setTimeout(1500, () => {
      request.destroy();
      resolve(false);
    });
  });
}

export function waitForServer(maxAttempts = 120) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const check = () => {
      const request = http.get(APP_URL, (response) => {
        response.resume();
        resolve();
      });

      request.on("error", () => {
        attempts += 1;
        if (attempts >= maxAttempts) {
          reject(new Error(`Vault Desk did not start at ${APP_URL}`));
          return;
        }
        setTimeout(check, 500);
      });
    };

    check();
  });
}

export function startServer() {
  if (serverProcess) return serverProcess;

  const nextBin = path.join(rootDir, "node_modules", "next", "dist", "bin", "next");
  serverProcess = spawn(
    process.execPath,
    [nextBin, "start", "-H", APP_HOST, "-p", String(APP_PORT)],
    {
      cwd: rootDir,
      env: { ...process.env, NODE_ENV: "production" },
      stdio: "pipe",
    },
  );

  serverProcess.stdout?.on("data", (chunk) => process.stdout.write(chunk));
  serverProcess.stderr?.on("data", (chunk) => process.stderr.write(chunk));
  serverProcess.on("exit", () => {
    serverProcess = null;
  });

  return serverProcess;
}

export function stopServer() {
  if (!serverProcess) return;
  serverProcess.kill("SIGTERM");
  serverProcess = null;
}
