import { assertEquals, assertStringIncludes } from "@std/assert";
import {
  collectRegistryEntries,
  generateRegistry,
  renderRegistrySource,
} from "./registry.ts";

Deno.test("renderRegistrySource emits imports and story array", () => {
  const source = renderRegistrySource([
    {
      moduleAlias: "storyMod0",
      importPath: "@source/components/Foo/foo.story.ts",
      exportName: "fooDefault",
    },
    {
      moduleAlias: "storyMod0",
      importPath: "@source/components/Foo/foo.story.ts",
      exportName: "fooAlt",
    },
  ]);

  assertStringIncludes(source, 'import * as storyMod0 from "@source/components/Foo/foo.story.ts"');
  assertStringIncludes(source, "storyMod0.fooDefault");
  assertStringIncludes(source, "storyMod0.fooAlt");
  assertStringIncludes(source, "export function getStoryById");
});

Deno.test("generateRegistry writes discovered stories", async () => {
  const root = await Deno.makeTempDir({ prefix: "cover-art-registry-" });
  const outDir = await Deno.makeTempDir({ prefix: "cover-art-registry-out-" });
  try {
    await Deno.mkdir(`${root}/widgets`);
    await Deno.writeTextFile(
      `${root}/widgets/demo.story.ts`,
      `export const demoDefault = {
        id: "demo/default",
        title: "Demo",
        category: "Layout",
        render() {},
      };`,
    );

    const rootUrl = new URL(`file://${root}/`);
    const outputPath = new URL("registry.generated.ts", `file://${outDir}/`);

    const entries = await generateRegistry({
      sourceRoot: rootUrl,
      outputPath,
    });

    assertEquals(entries.length, 1);
    assertEquals(entries[0].exportName, "demoDefault");

    const written = await Deno.readTextFile(outputPath);
    assertStringIncludes(written, "widgets/demo.story.ts");
    assertStringIncludes(written, "demoDefault");
  } finally {
    await Deno.remove(root, { recursive: true });
    await Deno.remove(outDir, { recursive: true });
  }
});

Deno.test("collectRegistryEntries parses exports from files", async () => {
  const root = await Deno.makeTempDir({ prefix: "cover-art-collect-" });
  try {
    await Deno.writeTextFile(
      `${root}/alpha.story.ts`,
      "export const alpha: Story = {};\nexport const beta: Story = {};",
    );

    const entries = await collectRegistryEntries(new URL(`file://${root}/`), new URL(`file://${root}/registry.generated.ts`));
    assertEquals(entries.map((e) => e.exportName), ["alpha", "beta"]);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
