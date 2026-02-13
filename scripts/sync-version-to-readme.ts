#!/usr/bin/env npx tsx
/**
 * Syncs lib/version.json to the README.md "Latest Updates" section.
 * Run: npm run version:sync
 */
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const VERSION_FILE = join(ROOT, "lib", "version.json");
const README_FILE = join(ROOT, "README.md");

const VERSION_START = "<!-- VERSION_SECTION - Do not edit manually; run `npm run version:sync` to update from lib/version.json -->";
const VERSION_END = "<!-- VERSION_SECTION_END -->";

function main() {
  const versionData = JSON.parse(readFileSync(VERSION_FILE, "utf-8"));
  const updates = versionData.updates as Array<{ version: string; note: string }>;
  const lines = updates.map((u) => `- v${u.version} - ${u.note}`).join("\n");

  let readme = readFileSync(README_FILE, "utf-8");
  const startIdx = readme.indexOf(VERSION_START);
  const endIdx = readme.indexOf(VERSION_END);

  if (startIdx === -1 || endIdx === -1) {
    console.error("README.md missing VERSION_SECTION markers. Add them around the Latest Updates section.");
    process.exit(1);
  }

  const before = readme.slice(0, startIdx + VERSION_START.length);
  const after = readme.slice(endIdx);
  const updated = before + "\n" + lines + "\n" + after;

  writeFileSync(README_FILE, updated);
  console.log(`Updated README.md with v${versionData.version} (${updates.length} update(s))`);
}

main();
