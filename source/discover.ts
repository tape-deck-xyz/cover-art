/** @file Discover *.story.ts files under a source root. */

const STORY_SUFFIX = ".story.ts";
const SKIP_DIRS = new Set([".git", "node_modules", ".cache", ".build"]);

/** Recursively find all `*.story.ts` files under `root`. */
export async function discoverStoryFiles(root: URL): Promise<URL[]> {
  const found: URL[] = [];
  await walk(root, found);
  found.sort((a, b) => a.pathname.localeCompare(b.pathname));
  return found;
}

async function walk(dir: URL, found: URL[]): Promise<void> {
  for await (const entry of Deno.readDir(dir)) {
    if (SKIP_DIRS.has(entry.name)) continue;

    const entryUrl = new URL(`${entry.name}/`, dir);
    if (entry.isDirectory) {
      await walk(entryUrl, found);
      continue;
    }

    if (entry.isFile && entry.name.endsWith(STORY_SUFFIX)) {
      found.push(new URL(entry.name, dir));
    }
  }
}

/** Relative path from `root` to `file`, using forward slashes. */
export function relativeStoryPath(root: URL, file: URL): string {
  const rootPath = root.pathname.replace(/\/$/, "");
  const filePath = file.pathname;
  if (!filePath.startsWith(rootPath + "/")) {
    throw new Error(`Story file is outside source root: ${file.pathname}`);
  }
  return filePath.slice(rootPath.length + 1);
}
