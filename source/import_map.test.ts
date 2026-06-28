import { assertEquals, assertStringIncludes } from "@std/assert";
import { coverArtRoot } from "../paths.ts";
import { buildImportMapEntries, writeImportMap } from "./import_map.ts";
const samplesRoot = new URL("../../samples/", import.meta.url);

Deno.test("buildImportMapEntries maps @source and merges source imports", async () => {
  const outputPath = new URL(".build/import-map.json", coverArtRoot);
  const entries = await buildImportMapEntries({
    sourceRoot: samplesRoot,
    coverArtRoot,
    outputPath,
  });

  assertStringIncludes(entries["@source/"], "samples");
  assertEquals(entries["@tape-deck/cover-art/"], "../");
  assertEquals(typeof entries["@tape-deck/util/"], "string");
});

Deno.test("writeImportMap writes valid JSON", async () => {
  const outDir = await Deno.makeTempDir({ prefix: "cover-art-import-map-" });
  try {
    const outputPath = new URL("import-map.json", `file://${outDir}/`);
    await writeImportMap({
      sourceRoot: samplesRoot,
      coverArtRoot,
      outputPath,
    });

    const text = await Deno.readTextFile(outputPath);
    const parsed = JSON.parse(text) as { imports: Record<string, string> };
    assertEquals(typeof parsed.imports["@source/"], "string");
    assertEquals(typeof parsed.imports["@tape-deck/cover-art/"], "string");
  } finally {
    await Deno.remove(outDir, { recursive: true });
  }
});
