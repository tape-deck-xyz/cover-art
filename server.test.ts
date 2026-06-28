import { assertEquals } from "@std/assert";
import { contentType, resolvePath } from "./server.ts";

const root = new URL(".", import.meta.url);

Deno.test("resolvePath maps / to index.html", () => {
  const fileUrl = resolvePath("/", root);
  assertEquals(fileUrl?.pathname.endsWith("/index.html"), true);
});

Deno.test("resolvePath rejects path traversal", () => {
  assertEquals(resolvePath("/../samples/deno.json", root), null);
  assertEquals(resolvePath("/..", root), null);
});

Deno.test("contentType returns html for index.html", () => {
  assertEquals(
    contentType(`${root.pathname}index.html`),
    "text/html; charset=utf-8",
  );
});
