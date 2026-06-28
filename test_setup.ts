/** @file Prepare gallery artifacts before running tests. */

import { prepareGallery } from "./source/prepare.ts";

await prepareGallery({ source: "../samples" });
