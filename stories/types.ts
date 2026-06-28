/** @file Story types for the component gallery. */

/** Story categories shown in the sidebar. */
export type StoryCategory =
  | "Icons"
  | "Layout"
  | "Controls"
  | "Content"
  | "Admin";

/**
 * A single gallery story — one visual example of a component or variant.
 */
export interface Story {
  /** Unique id, used in URLs (`?story=...`). */
  id: string;
  /** Display title in the sidebar. */
  title: string;
  /** Sidebar grouping. */
  category: StoryCategory;
  /** Mount the component(s) into the preview container. */
  render: (container: HTMLElement) => void | Promise<void>;
  /** Optional cleanup when switching stories. */
  teardown?: () => void;
}
