/** @file Generate a merged import map for bundling a story source. */

export interface ImportMapOptions {
  sourceRoot: URL;
  coverArtRoot: URL;
  outputPath: URL;
}

interface DenoConfig {
  imports?: Record<string, string>;
}

/** Read `deno.json` or `deno.jsonc` from `dir` if present. */
export async function readDenoConfig(dir: URL): Promise<DenoConfig> {
  for (const name of ["deno.json", "deno.jsonc"]) {
    const path = new URL(name, dir);
    try {
      const text = await Deno.readTextFile(path);
      const json = name.endsWith(".jsonc")
        ? text.replace(/\/\/.*$/gm, "").replace(/,\s*([\]}])/g, "$1")
        : text;
      return JSON.parse(json) as DenoConfig;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) continue;
      throw error;
    }
  }
  return {};
}

/** Resolve an import map entry relative to `base`. */
export function resolveImportEntry(base: URL, value: string): string {
  if (value.startsWith("jsr:") || value.startsWith("npm:")) {
    return value;
  }
  if (value.startsWith("file://")) {
    return value;
  }
  const resolved = new URL(value, base);
  return toImportMapPath(resolved);
}

/** Format a URL for use in an import map (relative to output dir when possible). */
function toImportMapPath(url: URL): string {
  return url.href;
}

/** Build import map entries for a resolved source root. */
export async function buildImportMapEntries(
  options: ImportMapOptions,
): Promise<Record<string, string>> {
  const { sourceRoot, coverArtRoot, outputPath } = options;
  const outputDir = new URL("./", outputPath);

  const sourceConfig = await readDenoConfig(sourceRoot);
  const coverArtConfig = await readDenoConfig(coverArtRoot);

  const imports: Record<string, string> = {};

  if (sourceConfig.imports) {
    for (const [key, value] of Object.entries(sourceConfig.imports)) {
      imports[key] = resolveImportEntry(sourceRoot, value);
    }
  }

  if (coverArtConfig.imports) {
    for (const [key, value] of Object.entries(coverArtConfig.imports)) {
      if (key.startsWith("@tape-deck/samples/")) continue;
      if (!(key in imports)) {
        imports[key] = resolveImportEntry(coverArtRoot, value);
      }
    }
  }

  imports["@source/"] = toImportMapPath(sourceRoot);
  imports["@tape-deck/cover-art/"] = toImportMapPath(coverArtRoot);

  // Prefer paths relative to the import map file for local roots.
  imports["@source/"] = relativeTo(outputDir, sourceRoot);
  imports["@tape-deck/cover-art/"] = relativeTo(outputDir, coverArtRoot);

  return imports;
}

function relativeTo(from: URL, to: URL): string {
  const fromParts = from.pathname.split("/").filter(Boolean);
  const toParts = to.pathname.split("/").filter(Boolean);

  let i = 0;
  while (i < fromParts.length && i < toParts.length && fromParts[i] === toParts[i]) {
    i++;
  }

  const up = fromParts.length > i ? "../".repeat(fromParts.length - i) : "";
  const down = toParts.slice(i).join("/");
  if (!down) return up || "./";
  return `${up}${down}/`;
}

/** Write `.build/import-map.json` for bundling. */
export async function writeImportMap(options: ImportMapOptions): Promise<void> {
  const imports = await buildImportMapEntries(options);
  const importMap = { imports };

  await Deno.mkdir(new URL("./", options.outputPath), { recursive: true });
  await Deno.writeTextFile(
    options.outputPath,
    JSON.stringify(importMap, null, 2) + "\n",
  );
}
