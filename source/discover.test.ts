import { assertEquals, assertThrows } from "@std/assert";
import {
  discoverStoryFiles,
  relativeStoryPath,
} from "./discover.ts";

Deno.test("discoverStoryFiles finds nested *.story.ts files", async () => {
  const root = await Deno.makeTempDir({ prefix: "cover-art-discover-" });
  try {
    await Deno.mkdir(`${root}/components/Foo`, { recursive: true });
    await Deno.mkdir(`${root}/node_modules/pkg`, { recursive: true });
    await Deno.writeTextFile(`${root}/components/Foo/foo.story.ts`, "export const x = 1;");
    await Deno.writeTextFile(`${root}/components/bar.story.ts`, "export const y = 1;");
    await Deno.writeTextFile(`${root}/not-a-story.ts`, "export const z = 1;");
    await Deno.writeTextFile(
      `${root}/node_modules/pkg/hidden.story.ts`,
      "export const hidden = 1;",
    );

    const rootUrl = new URL(`file://${root}/`);
    const files = await discoverStoryFiles(rootUrl);
    assertEquals(files.length, 2);
    assertEquals(
      files.map((f) => relativeStoryPath(rootUrl, f)),
      ["components/bar.story.ts", "components/Foo/foo.story.ts"],
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("relativeStoryPath rejects files outside root", () => {
  const root = new URL("file:///tmp/source/");
  const outside = new URL("file:///tmp/other/story.story.ts");
  assertThrows(
    () => relativeStoryPath(root, outside),
    Error,
    "outside source root",
  );
});
