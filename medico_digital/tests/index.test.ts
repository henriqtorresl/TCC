import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function collectTestFiles(directory: string): string[] {
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  return entries
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return collectTestFiles(entryPath);
      }

      if (!entry.name.endsWith(".test.ts") || entry.name === "index.test.ts") {
        return [];
      }

      return [entryPath];
    })
    .sort((left, right) => left.localeCompare(right));
}

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

for (const file of collectTestFiles(currentDirectory)) {
  require(file);
}
