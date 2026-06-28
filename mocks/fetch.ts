/** @file Browser fetch mocks for gallery stories. */

const originalFetch = globalThis.fetch.bind(globalThis);

/**
 * Installs gallery fetch mocks. Restores original fetch when teardown runs.
 */
export function installFetchMocks(): () => void {
  globalThis.fetch = (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const url = typeof input === "string"
      ? input
      : input instanceof URL
      ? input.toString()
      : input.url;

    if (url.includes("/info?refresh=1")) {
      return Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }

    return originalFetch(input, init);
  };

  return () => {
    globalThis.fetch = originalFetch;
  };
}

/**
 * Prevents full page reload when refresh-cache succeeds in the gallery.
 */
export function installReloadMock(): () => void {
  const location = globalThis.location;
  const originalReload = location.reload.bind(location);

  location.reload = () => {
    console.info("[cover-art] location.reload() suppressed in gallery preview");
  };

  return () => {
    location.reload = originalReload;
  };
}
