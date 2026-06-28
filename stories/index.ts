/** @file Gallery story registry — re-exports generated entries. */

export type { Story, StoryCategory } from "./types.ts";

let generated: typeof import("./registry.generated.ts") | undefined;

try {
  generated = await import("./registry.generated.ts");
} catch (error) {
  if (
    error instanceof TypeError &&
    String(error.message).includes("Could not resolve")
  ) {
    throw new Error(
      "Story registry not generated. Run `deno task start -- --source <path>` first.",
    );
  }
  if (error instanceof Deno.errors.NotFound) {
    throw new Error(
      "Story registry not generated. Run `deno task start -- --source <path>` first.",
    );
  }
  throw error;
}

export const categoryOrder = generated!.categoryOrder;
export const stories = generated!.stories;
export const getStoryById = generated!.getStoryById;
