import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const MAX_LINES = 350;
const SRC_DIR = new URL("../src", import.meta.url).pathname;

async function getFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getFiles(fullPath)));
    } else if (/\.(ts|js|mjs|css)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

async function checkArchitecture() {
  let hasErrors = false;
  let files = [];
  try {
    files = await getFiles(SRC_DIR);
  } catch (err) {
    if (err.code === "ENOENT") {
      console.log("No src directory found yet, skipping check.");
      return;
    }
    throw err;
  }

  for (const file of files) {
    const rel = relative(SRC_DIR, file);
    const content = await readFile(file, "utf8");
    const lines = content.split("\n");

    // 1. Line count check
    if (lines.length > MAX_LINES) {
      console.error(`❌ [Line Limit Error] ${rel} has ${lines.length} lines (max: ${MAX_LINES})`);
      hasErrors = true;
    }

    // 2. Layering import checks
    if (rel.startsWith("shared/")) {
      const illegal = content.match(/from\s+["'](\.\.\/(?:data|features|app)[^"']*)["']/g);
      if (illegal) {
        console.error(`❌ [Layer Violation] Shared layer file ${rel} illegally imports upper layers:`, illegal);
        hasErrors = true;
      }
    } else if (rel.startsWith("data/")) {
      const illegal = content.match(/from\s+["'](\.\.\/(?:features|app)[^"']*)["']/g);
      if (illegal) {
        console.error(`❌ [Layer Violation] Data layer file ${rel} illegally imports upper layers:`, illegal);
        hasErrors = true;
      }
    } else if (rel.startsWith("features/")) {
      const illegal = content.match(/from\s+["'](\.\.\/(?:app)[^"']*)["']/g);
      if (illegal) {
        console.error(`❌ [Layer Violation] Features layer file ${rel} illegally imports App layer:`, illegal);
        hasErrors = true;
      }
    }
  }

  if (hasErrors) {
    console.error("\nArchitecture check failed!");
    process.exit(1);
  } else {
    console.log(`\n✔ Architecture check passed (${files.length} files scanned, <= ${MAX_LINES} lines, strict layering verified)`);
  }
}

checkArchitecture();

