import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { buildOpenApiSpec } from "../src/lib/server/openapi";

const projectRoot = path.resolve(process.cwd());
const apiRoot = path.join(projectRoot, "src", "app", "api");

async function collectRouteFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });

  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return collectRouteFiles(fullPath);
      }

      return entry.name === "route.ts" ? [fullPath] : [];
    }),
  );

  return nested.flat();
}

function normalizeRoutePath(filePath: string): string {
  const relative = path.relative(apiRoot, path.dirname(filePath));
  return (
    "/api/" +
    relative.split(path.sep).join("/").replace(/\[(.+?)\]/g, "{$1}")
  );
}

test("OpenAPI documents every API route", async () => {
  const routeFiles = await collectRouteFiles(apiRoot);
  const actualPaths = routeFiles.map(normalizeRoutePath).sort();
  const spec = buildOpenApiSpec();
  const documentedPaths = Object.keys(spec.paths).sort();

  assert.deepEqual(documentedPaths, actualPaths);

  for (const filePath of routeFiles) {
    const routePath = normalizeRoutePath(filePath);
    const source = await fs.readFile(filePath, "utf8");
    const declaredMethods = [
      ...source.matchAll(/export\s+(?:async\s+)?function\s+([A-Z]+)/g),
    ].map((match) => match[1].toLowerCase());

    assert.deepEqual(
      Object.keys(spec.paths[routePath] ?? {}).sort(),
      declaredMethods.sort(),
      `Route ${routePath} is missing method docs`,
    );
  }
});
