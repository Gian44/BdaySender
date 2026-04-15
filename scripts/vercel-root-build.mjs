import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const rootDir = process.cwd();
const appDir = resolve(rootDir, "bdaysender-web");
const appNextDir = resolve(appDir, ".next");
const rootNextDir = resolve(rootDir, ".next");

execSync("npm run build", {
  cwd: appDir,
  stdio: "inherit",
  env: process.env,
});

if (!existsSync(appNextDir)) {
  throw new Error("Build completed but bdaysender-web/.next was not found.");
}

rmSync(rootNextDir, { recursive: true, force: true });
mkdirSync(rootNextDir, { recursive: true });
cpSync(appNextDir, rootNextDir, { recursive: true });

console.log("Copied bdaysender-web/.next to root .next for Vercel output detection.");
