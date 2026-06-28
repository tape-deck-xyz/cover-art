import { assertEquals, assertExists } from "@std/assert";
import { prepareGallery } from "../source/prepare.ts";
import type { StoryCategory } from "./types.ts";

await prepareGallery({ source: "../samples" });

const { categoryOrder, getStoryById, stories } = await import("./index.ts");

Deno.test("story registry has unique ids", () => {
  const ids = stories.map((story) => story.id);
  assertEquals(new Set(ids).size, ids.length);
});

Deno.test("every story has a render function", () => {
  for (const story of stories) {
    assertEquals(typeof story.render, "function");
  }
});

Deno.test("story categories are valid", () => {
  const allowed = new Set<string>(categoryOrder);
  for (const story of stories) {
    assertEquals(allowed.has(story.category), true, story.id);
  }
});

Deno.test("getStoryById returns matching story", () => {
  const first = stories[0];
  assertExists(first);
  assertEquals(getStoryById(first.id)?.title, first.title);
  assertEquals(getStoryById("missing/story"), undefined);
});

Deno.test("category order includes every used category", () => {
  const used = new Set(stories.map((story) => story.category));
  for (const category of used) {
    assertEquals(categoryOrder.includes(category as StoryCategory), true);
  }
});

Deno.test("discovered stories include migrated samples entries", () => {
  assertEquals(stories.length >= 10, true);
  assertExists(getStoryById("icons/grid"));
  assertExists(getStoryById("site-footer/default"));
});
