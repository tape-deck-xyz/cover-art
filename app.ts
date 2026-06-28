/** @file Gallery shell — sidebar navigation and story preview. */

import { categoryOrder, getStoryById, stories } from "./stories/index.ts";
import type { Story } from "./stories/types.ts";

const navEl = document.getElementById("story-nav");
const filterEl = document.getElementById("story-filter") as
  | HTMLInputElement
  | null;
const titleEl = document.getElementById("story-title");
const idEl = document.getElementById("story-id");
const previewEl = document.getElementById("preview");

if (!navEl || !filterEl || !titleEl || !idEl || !previewEl) {
  throw new Error("Gallery shell markup is missing required elements.");
}

let activeStory: Story | undefined;
let filterText = "";

function storyMatchesFilter(story: Story): boolean {
  if (!filterText) return true;
  const haystack = `${story.title} ${story.id} ${story.category}`.toLowerCase();
  return haystack.includes(filterText);
}

function updateUrl(storyId: string): void {
  const url = new URL(globalThis.location.href);
  url.searchParams.set("story", storyId);
  globalThis.history.replaceState(null, "", url);
}

function renderNav(): void {
  navEl!.innerHTML = "";

  for (const category of categoryOrder) {
    const items = stories.filter((story) =>
      story.category === category && storyMatchesFilter(story)
    );
    if (items.length === 0) continue;

    const group = document.createElement("section");
    group.className = "gallery-nav__group";

    const heading = document.createElement("h3");
    heading.className = "gallery-nav__heading";
    heading.textContent = category;
    group.appendChild(heading);

    const list = document.createElement("ul");
    list.className = "gallery-nav__list";

    for (const story of items) {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "gallery-nav__link";
      button.textContent = story.title;
      button.setAttribute("data-story-id", story.id);
      button.setAttribute(
        "aria-current",
        story.id === activeStory?.id ? "true" : "false",
      );
      button.addEventListener("click", () => {
        void selectStory(story.id);
      });
      item.appendChild(button);
      list.appendChild(item);
    }

    group.appendChild(list);
    navEl!.appendChild(group);
  }
}

async function selectStory(storyId: string): Promise<void> {
  const story = getStoryById(storyId);
  if (!story) return;

  activeStory?.teardown?.();
  previewEl!.replaceChildren();
  activeStory = story;

  titleEl!.textContent = story.title;
  idEl!.textContent = story.id;
  updateUrl(story.id);
  renderNav();

  try {
    await story.render(previewEl!);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    previewEl!.innerHTML = `
      <div class="story-error" role="alert">
        <p class="story-error__title">Story render failed</p>
        <pre class="story-error__detail">${message}</pre>
      </div>`;
  }
}

function pickInitialStoryId(): string {
  const fromUrl = new URL(globalThis.location.href).searchParams.get("story");
  if (fromUrl && getStoryById(fromUrl)) return fromUrl;
  return stories[0]?.id ?? "";
}

filterEl.addEventListener("input", () => {
  filterText = filterEl!.value.trim().toLowerCase();
  renderNav();
});

const initialId = pickInitialStoryId();
if (initialId) {
  void selectStory(initialId);
} else {
  renderNav();
}
