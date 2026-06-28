import { assertEquals } from "@std/assert";
import { parseStoryExportNames } from "./story_exports.ts";

Deno.test("parseStoryExportNames finds typed Story exports", () => {
  const source = `
export const foo: Story = { id: "a" };
export const bar: Story = { id: "b" };
export type StoryCategory = "Icons";
`;
  assertEquals(parseStoryExportNames(source), ["foo", "bar"]);
});

Deno.test("parseStoryExportNames finds inferred Story exports", () => {
  const source = `export const baz = { id: "c", title: "Baz" };`;
  assertEquals(parseStoryExportNames(source), ["baz"]);
});
