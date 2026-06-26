import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

async function collectTestFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectTestFiles(entryPath)));
      continue;
    }

    if (!entry.name.endsWith(".test.ts") || entry.name === "index.test.ts") {
      continue;
    }

    files.push(entryPath);
  }

  return files.sort((left, right) => left.localeCompare(right));
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const testsDir = path.join(repoRoot, "tests");
const testFiles = await collectTestFiles(testsDir);

const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "medico-digital-tests-"));
const entrypoint = path.join(tempDir, "index.mts");
const source = `${testFiles
  .map((file) => `import ${JSON.stringify(pathToFileURL(file).href)};`)
  .join("\n")}\n`;

await fs.writeFile(entrypoint, source, "utf8");

const result = spawnSync(process.execPath, ["--import", "tsx", "--test", entrypoint], {
  cwd: repoRoot,
  stdio: "inherit",
});

await fs.rm(tempDir, { recursive: true, force: true });

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
