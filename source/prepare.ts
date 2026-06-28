/** @file Prepare import map and story registry for a resolved source. */

import { coverArtRoot } from "../paths.ts";
import { writeImportMap } from "./import_map.ts";
import { generateRegistry } from "./registry.ts";
import { defaultSource, resolveSource } from "./resolve.ts";

export interface PrepareOptions {
  source?: string;
  ref?: string;
}

export interface PrepareResult {
  sourceRoot: URL;
  sourceSpec: string;
}

/** Resolve the source spec from CLI, env, or sibling default. */
export async function resolveSourceSpec(
  specified?: string,
): Promise<string> {
  if (specified) return specified;

  const fromEnv = Deno.env.get("COVER_ART_SOURCE");
  if (fromEnv) return fromEnv;

  const defaultPath = defaultSource(coverArtRoot);
  const stat = await Deno.stat(defaultPath).catch(() => null);
  if (stat?.isDirectory) return "../samples";

  throw new Error(
    "No story source found. Pass --source <path|git-url> or set COVER_ART_SOURCE.",
  );
}

/** Generate import map and story registry for the given source. */
export async function prepareGallery(
  options: PrepareOptions = {},
): Promise<PrepareResult> {
  const sourceSpec = await resolveSourceSpec(options.source);
  const sourceRoot = await resolveSource({
    source: sourceSpec,
    ref: options.ref,
    cwd: coverArtRoot,
  });

  const importMapPath = new URL(".build/import-map.json", coverArtRoot);
  const registryPath = new URL("stories/registry.generated.ts", coverArtRoot);

  await writeImportMap({
    sourceRoot,
    coverArtRoot,
    outputPath: importMapPath,
  });

  const entries = await generateRegistry({
    sourceRoot,
    outputPath: registryPath,
  });

  if (entries.length === 0) {
    console.warn(
      `Warning: no *.story.ts files found under ${sourceRoot.pathname}`,
    );
  }

  console.log(
    `Prepared ${entries.length} stories from ${sourceSpec}`,
  );

  return { sourceRoot, sourceSpec };
}

/** Bundle the gallery browser app. */
export async function bundleGallery(): Promise<void> {
  const result = await new Deno.Command(Deno.execPath(), {
    args: [
      "bundle",
      "--import-map",
      ".build/import-map.json",
      "--platform=browser",
      "app.ts",
      "-o",
      ".build/app.js",
    ],
    cwd: coverArtRoot,
    stdout: "inherit",
    stderr: "inherit",
  }).output();

  if (!result.success) {
    throw new Error("deno bundle failed");
  }
}
