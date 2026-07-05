import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import path from "node:path";

// Minimal ESM resolve hook so `node --test` understands the "@/..." path alias
// (mapped to the project root in tsconfig). Node 24 strips TypeScript types
// natively, so no build step or extra dependency is needed to run .ts tests.
const root = process.cwd();

export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    let target = path.join(root, specifier.slice(2));

    if (!path.extname(target)) {
      if (existsSync(`${target}.ts`)) {
        target = `${target}.ts`;
      } else if (existsSync(path.join(target, "index.ts"))) {
        target = path.join(target, "index.ts");
      }
    }

    return next(pathToFileURL(target).href, context);
  }

  return next(specifier, context);
}
