/** @file Static file server for the component gallery. */

export const MIME_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

/** Resolve a request pathname to a file URL under `root`, or null if unsafe. */
export function resolvePath(pathname: string, root: URL): URL | null {
  const relative = pathname === "/"
    ? "index.html"
    : pathname.replace(/^\//, "");
  if (relative.includes("..")) return null;

  const fileUrl = new URL(relative, root);
  if (!fileUrl.pathname.startsWith(root.pathname)) return null;
  return fileUrl;
}

/** Infer Content-Type from a file pathname. */
export function contentType(pathname: string): string {
  const ext = pathname.includes(".")
    ? pathname.slice(pathname.lastIndexOf("."))
    : "";
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

/** Start the gallery static file server. */
export function startServer(options?: { port?: number; root?: URL }): void {
  const port = options?.port ??
    parseInt(Deno.env.get("PORT") ?? "5173", 10);
  const root = options?.root ?? new URL(".", import.meta.url);

  console.log(`cover-art gallery running at http://localhost:${port}`);

  Deno.serve({ port }, async (req) => {
    const url = new URL(req.url);
    const fileUrl = resolvePath(url.pathname, root);

    if (!fileUrl) {
      return new Response("Not Found", { status: 404 });
    }

    try {
      const file = await Deno.readFile(fileUrl);
      return new Response(file, {
        headers: { "Content-Type": contentType(fileUrl.pathname) },
      });
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return new Response("Not Found", { status: 404 });
      }
      console.error(`Failed to serve ${url.pathname}:`, error);
      return new Response("Internal Server Error", { status: 500 });
    }
  });
}

if (import.meta.main) {
  startServer();
}
