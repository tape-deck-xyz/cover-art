import { assertEquals, assertRejects } from "@std/assert";
import { coverArtRoot } from "../paths.ts";
import {
  defaultSource,
  gitCacheDirName,
  isGitSource,
  resolveLocalSource,
  resolveSource,
} from "./resolve.ts";

Deno.test("isGitSource detects git remotes", () => {
  assertEquals(isGitSource("git@github.com:org/repo.git"), true);
  assertEquals(
    isGitSource("https://github.com/org/repo.git"),
    true,
  );
  assertEquals(isGitSource("../samples"), false);
});

Deno.test("gitCacheDirName produces stable directory names", () => {
  assertEquals(
    gitCacheDirName("git@github.com:org/repo.git"),
    "git-github-com-org-repo-git",
  );
});

Deno.test("resolveLocalSource resolves relative paths from cwd", () => {
  const resolved = resolveLocalSource("../samples", coverArtRoot);
  assertEquals(resolved.pathname.endsWith("/samples/"), true);
});

Deno.test("resolveLocalSource resolves absolute paths", () => {
  const abs = new URL("../samples", coverArtRoot).pathname;
  const resolved = resolveLocalSource(abs, coverArtRoot);
  assertEquals(resolved.pathname.endsWith("/samples/"), true);
});

Deno.test("defaultSource points at sibling samples", () => {
  assertEquals(defaultSource(coverArtRoot).includes("/samples"), true);
});

Deno.test("resolveSource rejects missing local directory", async () => {
  await assertRejects(
    () =>
      resolveSource({
        source: "./definitely-missing-source-dir-12345",
        cwd: coverArtRoot,
      }),
    Error,
    "Source directory not found",
  );
});

Deno.test("resolveSource resolves existing sibling samples", async () => {
  const source = await resolveSource({
    source: "../samples",
    cwd: coverArtRoot,
  });
  assertEquals(source.pathname.endsWith("/samples/"), true);
});
