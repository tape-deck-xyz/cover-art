/** @file Gallery entry — resolve source, prepare stories, bundle, serve. */

import { parseArgs } from "@std/cli/parse-args";
import { coverArtRoot } from "./paths.ts";
import { bundleGallery, prepareGallery } from "./source/prepare.ts";
import { startServer } from "./server.ts";

const cli = parseArgs(Deno.args, {
  string: ["source", "ref"],
  boolean: ["dev"],
  alias: { source: "s" },
});

async function main(): Promise<void> {
  const { sourceRoot, sourceSpec } = await prepareGallery({
    source: cli.source,
    ref: cli.ref,
  });

  console.log("Bundling gallery app…");
  await bundleGallery();

  const port = parseInt(Deno.env.get("PORT") ?? "5173", 10);
  console.log(`Starting gallery server for ${sourceSpec}…`);
  startServer({ port, root: coverArtRoot });

  if (cli.dev) {
    console.log(
      "Dev mode: edit *.story.ts files in the source and save to trigger rebuild.",
    );
    console.log(`Watching ${sourceRoot.pathname}`);
  }
}

if (import.meta.main) {
  await main();
}
