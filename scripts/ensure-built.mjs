import { existsSync } from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildIdPath = path.join(rootDir, ".next", "BUILD_ID");

if (!existsSync(buildIdPath)) {
  console.log("First launch: building Vault Desk (one-time, ~1 minute)...");
  const result = spawnSync("npm", ["run", "build"], {
    cwd: rootDir,
    stdio: "inherit",
    shell: true,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
