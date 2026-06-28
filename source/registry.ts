/** @file Generate stories/registry.generated.ts from discovered story files. */

import { discoverStoryFiles } from "./discover.ts";
import { parseStoryExportNames } from "./story_exports.ts";
import type { StoryCategory } from "../stories/types.ts";

export interface RegistryEntry {
  moduleAlias: string;
  importPath: string;
  exportName: string;
}

export interface GenerateRegistryOptions {
  sourceRoot: URL;
  outputPath: URL;
}

/** Category display order in the sidebar. */
export const categoryOrder: StoryCategory[] = [
  "Icons",
  "Layout",
  "Content",
  "Controls",
  "Admin",
];

/** Collect story module entries from discovered files. */
export function registryImportPath(
  registryFile: URL,
  storyFile: URL,
): string {
  const registryDir = registryFile.pathname.replace(/\/[^/]+$/, "/");
  const storyPath = storyFile.pathname;

  const registryParts = registryDir.split("/").filter(Boolean);
  const storyParts = storyPath.split("/").filter(Boolean);

  let i = 0;
  while (
    i < registryParts.length &&
    i < storyParts.length &&
    registryParts[i] === storyParts[i]
  ) {
    i++;
  }

  const up = "../".repeat(registryParts.length - i);
  const down = storyParts.slice(i).join("/");
  return `${up}${down}`;
}

/** Collect story module entries from discovered files. */
export async function collectRegistryEntries(
  sourceRoot: URL,
  registryFile: URL,
): Promise<RegistryEntry[]> {
  const files = await discoverStoryFiles(sourceRoot);
  const entries: RegistryEntry[] = [];

  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    const source = await Deno.readTextFile(file);
    const exportNames = parseStoryExportNames(source);
    const moduleAlias = `storyMod${index}`;
    const importPath = registryImportPath(registryFile, file);

    for (const exportName of exportNames) {
      entries.push({
        moduleAlias,
        importPath,
        exportName,
      });
    }
  }

  return entries;
}

/** Unique module imports needed for entries. */
function uniqueModules(
  entries: RegistryEntry[],
): Array<{ alias: string; importPath: string }> {
  const seen = new Map<string, string>();
  for (const entry of entries) {
    if (!seen.has(entry.moduleAlias)) {
      seen.set(entry.moduleAlias, entry.importPath);
    }
  }
  return [...seen.entries()].map(([alias, importPath]) => ({ alias, importPath }));
}

/** Generate TypeScript source for the story registry. */
export function renderRegistrySource(entries: RegistryEntry[]): string {
  const modules = uniqueModules(entries);
  const importLines = modules.map(
    ({ alias, importPath }) => `import * as ${alias} from "${importPath}";`,
  );

  const storyRefs = entries.map(
    (entry) => `${entry.moduleAlias}.${entry.exportName}`,
  );

  return `/** @file Auto-generated story registry — do not edit. */

import type { Story, StoryCategory } from "./types.ts";
${importLines.join("\n")}

/** Category display order in the sidebar. */
export const categoryOrder: StoryCategory[] = [
  "Icons",
  "Layout",
  "Content",
  "Controls",
  "Admin",
];

function categoryRank(category: StoryCategory): number {
  const index = categoryOrder.indexOf(category);
  return index === -1 ? categoryOrder.length : index;
}

/** All gallery stories, sorted by category then title. */
export const stories: Story[] = [
  ${storyRefs.join(",\n  ")},
].sort((a, b) => {
  const byCategory = categoryRank(a.category) - categoryRank(b.category);
  if (byCategory !== 0) return byCategory;
  return a.title.localeCompare(b.title);
});

/** Lookup a story by id. */
export function getStoryById(id: string): Story | undefined {
  return stories.find((story) => story.id === id);
}
`;
}

/** Discover stories and write \`stories/registry.generated.ts\`. */
export async function generateRegistry(
  options: GenerateRegistryOptions,
): Promise<RegistryEntry[]> {
  const entries = await collectRegistryEntries(
    options.sourceRoot,
    options.outputPath,
  );
  const source = renderRegistrySource(entries);

  await Deno.mkdir(new URL("./", options.outputPath), { recursive: true });
  await Deno.writeTextFile(options.outputPath, source);

  return entries;
}
