/** @file Resolve --source to a local directory (path or git clone). */

import { coverArtRoot } from "../paths.ts";

const GIT_REMOTE_PATTERN =
  /^(?:git@|https?:\/\/|ssh:\/\/|git:\/\/).+\.git(?:#.*)?$|^git@.+:.+$/;

export interface ResolveSourceOptions {
  source: string;
  ref?: string;
  /** Directory for git clones (default: .cache/sources under cover-art root). */
  cacheRoot?: URL;
  /** Working directory for relative local paths (default: cover-art root). */
  cwd?: URL;
}

/** True when `source` looks like a git remote URL. */
export function isGitSource(source: string): boolean {
  return GIT_REMOTE_PATTERN.test(source) ||
    source.startsWith("git@") ||
    (source.startsWith("https://") && source.includes(".git"));
}

/** Stable cache directory name for a git remote. */
export function gitCacheDirName(source: string): string {
  return source
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "source";
}

/** Resolve a local filesystem path to an absolute directory URL. */
export function resolveLocalSource(source: string, cwd: URL): URL {
  const path = source.startsWith("/")
    ? source
    : new URL(source, cwd).pathname;
  const url = new URL(`file://${path.endsWith("/") ? path : path + "/"}`);
  return url;
}

/** Clone or update a git source; returns the checkout directory URL. */
export async function resolveGitSource(
  source: string,
  options?: { ref?: string; cacheRoot?: URL },
): Promise<URL> {
  const cacheRoot = options?.cacheRoot ??
    new URL(".cache/sources/", coverArtRoot);
  const dirName = gitCacheDirName(source);
  const target = new URL(`${dirName}/`, cacheRoot);

  await Deno.mkdir(cacheRoot, { recursive: true });

  const stat = await Deno.stat(target).catch(() => null);
  if (!stat) {
    const cloneArgs = ["clone", "--depth", "1"];
    if (options?.ref) {
      cloneArgs.push("--branch", options.ref);
    }
    cloneArgs.push(source, target.pathname);

    const result = await new Deno.Command("git", {
      args: cloneArgs,
      stdout: "inherit",
      stderr: "inherit",
    }).output();

    if (!result.success) {
      throw new Error(`git clone failed for ${source}`);
    }
  } else if (options?.ref) {
    const fetch = await new Deno.Command("git", {
      args: ["fetch", "--depth", "1", "origin", options.ref],
      cwd: target,
      stdout: "inherit",
      stderr: "inherit",
    }).output();
    if (!fetch.success) {
      throw new Error(`git fetch failed for ${source} ref ${options.ref}`);
    }
    const checkout = await new Deno.Command("git", {
      args: ["checkout", "FETCH_HEAD"],
      cwd: target,
      stdout: "inherit",
      stderr: "inherit",
    }).output();
    if (!checkout.success) {
      throw new Error(`git checkout failed for ${source} ref ${options.ref}`);
    }
  }

  return target;
}

/** Resolve `--source` to a readable directory URL. */
export async function resolveSource(
  options: ResolveSourceOptions,
): Promise<URL> {
  const cwd = options.cwd ?? coverArtRoot;

  if (isGitSource(options.source)) {
    return await resolveGitSource(options.source, {
      ref: options.ref,
      cacheRoot: options.cacheRoot,
    });
  }

  const local = resolveLocalSource(options.source, cwd);
  const stat = await Deno.stat(local).catch(() => null);
  if (!stat?.isDirectory) {
    throw new Error(`Source directory not found: ${options.source}`);
  }
  return local;
}

/** Default sibling samples path when present. */
export function defaultSource(cwd: URL): string {
  return new URL("../samples/", cwd).pathname;
}
