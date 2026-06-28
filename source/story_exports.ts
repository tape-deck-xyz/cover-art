/** @file Parse named Story exports from a *.story.ts file. */

const EXPORT_PATTERN = /^export\s+const\s+(\w+)\s*(?::\s*Story\b|=)/gm;

/** Return exported story binding names from source text. */
export function parseStoryExportNames(source: string): string[] {
  const names: string[] = [];
  for (const match of source.matchAll(EXPORT_PATTERN)) {
    names.push(match[1]);
  }
  return names;
}
