#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

function parseEnv(content) {
  const out = [];
  const lines = content.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out.push({ key, value });
  }
  return out;
}

function runVercel(args, stdinValue = "") {
  const proc = spawnSync("npx", ["vercel", ...args], {
    input: stdinValue,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    shell: process.platform === "win32",
  });
  return proc;
}

const envFileArg = process.argv.find((arg) => arg.startsWith("--file="));
const targetArg = process.argv.find((arg) => arg.startsWith("--target="));
const envFile = resolve(process.cwd(), envFileArg ? envFileArg.replace("--file=", "") : ".env.vercel.production");
const target = targetArg ? targetArg.replace("--target=", "") : "production";
const token = process.env.VERCEL_TOKEN?.trim();

if (!token) {
  console.error("Missing VERCEL_TOKEN. Set it before running this script.");
  process.exit(1);
}

if (!existsSync(envFile)) {
  console.error(`Env file not found: ${envFile}`);
  process.exit(1);
}

if (!existsSync(resolve(process.cwd(), ".vercel", "project.json"))) {
  console.error("Project is not linked to Vercel. Run: npx vercel link");
  process.exit(1);
}

const envEntries = parseEnv(readFileSync(envFile, "utf8"));
if (envEntries.length === 0) {
  console.error("No env entries found in file.");
  process.exit(1);
}

console.log(`Pushing ${envEntries.length} variables to Vercel (${target})...`);

for (const { key, value } of envEntries) {
  const removeProc = runVercel(["env", "rm", key, target, "--yes", "--token", token]);
  if (removeProc.status !== 0 && !removeProc.stderr.includes("was not found")) {
    console.warn(`Warning removing ${key}: ${removeProc.stderr.trim() || removeProc.stdout.trim()}`);
  }

  const addProc = runVercel(["env", "add", key, target, "--token", token], `${value}\n`);
  if (addProc.status !== 0) {
    console.error(`Failed adding ${key}: ${addProc.stderr.trim() || addProc.stdout.trim()}`);
    process.exit(addProc.status ?? 1);
  }

  console.log(`Updated ${key}`);
}

console.log("Vercel environment sync complete.");
