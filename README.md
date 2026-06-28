# cover-art

Storybook-like visual gallery for Web Components. Point it at any local
directory or git repo containing `*.story.ts` files.

## Setup

Clone with sibling repos (default source is `../samples`):

```
tape-deck.xyz/
  samples/
  util/
  cover-art/   ← you are here
```

## Usage

```bash
deno task start
```

Open [http://localhost:5173](http://localhost:5173).

Point at a specific source:

```bash
deno task start -- --source ../samples
deno task start -- --source git@github.com:tape-deck-xyz/samples.git
deno task start -- --source git@github.com:tape-deck-xyz/samples.git --ref main
```

Or set `COVER_ART_SOURCE` instead of `--source`.

For live reload while editing components or stories:

```bash
deno task dev -- --source ../samples
```

## Tests

```bash
deno task test
```

Tests prepare stories from `../samples` automatically.

## Adding a story (in the source repo)

Stories live **in the component library**, not in cover-art. Create a co-located
`*.story.ts` file next to the component:

```typescript
import type { Story } from "@tape-deck/cover-art/stories/types.ts";

export const myComponentDefault: Story = {
  id: "my-component/default",
  title: "Default",
  category: "Layout",
  async render(container) {
    await import("./my-component-custom-element.ts");
    container.innerHTML = `
      <my-component-custom-element some-attr="value">
      </my-component-custom-element>`;
  },
};
```

Restart or run `deno task dev` — cover-art scans for `**/*.story.ts` and
generates the registry at build time. No manual registration step.

### Conventions

- **Import components inside `render`**, not at the top of the file.
- **`id`** must be unique and URL-safe (`component-name/variant`). It becomes
  the `?story=` query param.
- **`category`** must be one of: `Icons`, `Layout`, `Content`, `Controls`,
  `Admin`. Add a new category in [`stories/types.ts`](stories/types.ts) if
  needed.
- **Preview helpers** — reuse classes from [`gallery.css`](gallery.css) (e.g.
  `.tracklist-frame`, `.icon-grid`) or add new ones there for shared layout.
- **Mocks** — if a component calls `fetch` or `location.reload`, import gallery
  mocks from `@tape-deck/cover-art/mocks/fetch.ts` and restore them in
  `teardown`. See
  [`samples/components/RefreshCache/refresh-cache.story.ts`](../samples/components/RefreshCache/refresh-cache.story.ts).
- **Bundle deps** — source repo `deno.json` imports are merged into the gallery
  import map at build time.

## Tasks

| Task               | Description                                              |
| ------------------ | -------------------------------------------------------- |
| `deno task start`  | Resolve source, generate registry, bundle, serve         |
| `deno task dev`    | Same as start, with file watch and rebuild               |
| `deno task bundle` | Build `.build/app.js` only (requires prepared import map) |
| `deno task serve`  | Serve static files (requires existing bundle)            |
| `deno task test`   | Run source, registry, and server tests                   |

## Deferred components

These need boombox `lib/` shims or further extraction in samples before they can
be previewed:

- `album-header-custom-element`, `album-image-custom-element`
- `nav-link`, `site-header-editor-custom-element`
- HTML helpers (`album-tile-html`, etc.)
- `playbar-custom-element` (needs audio/fetch mocks)
