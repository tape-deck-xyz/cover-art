# AGENTS.md

Visual component gallery shell. Discovers `*.story.ts` files from an external
source repo. Deno only — never use Node.

## Layout

Sibling repos for local dev:

```
tape-deck.xyz/
  samples/    ← default --source; stories live here
  util/       ← shared util (transitive via samples)
  cover-art/  ← this repo (generic gallery shell)
```

## Usage

```bash
deno task start -- --source ../samples
deno task dev   -- --source ../samples
```

## Conventions

- Standard CSS in `gallery.css` (no Tailwind)
- Story types exported from `@tape-deck/cover-art/stories/types.ts`
- Gallery mocks exported from `@tape-deck/cover-art/mocks/fetch.ts`
- Co-located tests in `stories/` and `source/`
- Run `deno task test` before committing
