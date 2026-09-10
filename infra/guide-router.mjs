// The custom address reads Brian's Netlify deployment; no site content lives here.
const ORIGIN = "https://menuconnect-shared-guide.netlify.app";
const PUBLIC_ORIGIN = "https://guide.menuconnect.ca";
export default {
  async fetch(request) {
    if (!["GET", "HEAD"].includes(request.method)) {
      return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    }
    const incoming = new URL(request.url);
    const target = new URL(ORIGIN);
    target.pathname = incoming.pathname;
    target.search = incoming.search;
    const headers = new Headers();
    for (const name of ["accept", "accept-encoding", "if-none-match", "if-modified-since", "range", "if-range", "user-agent"]) {
      if (request.headers.has(name)) headers.set(name, request.headers.get(name));
    }
    const upstream = await fetch(target, {
      method: request.method, headers, redirect: "manual",
      cf: { cacheEverything: false, cacheTtl: 0 },
    });
    const response = new Response(upstream.body, upstream);
    const location = response.headers.get("location");
    if (location) {
      const destination = new URL(location, target);
      if (destination.origin === ORIGIN) {
        response.headers.set("location", PUBLIC_ORIGIN + destination.pathname + destination.search + destination.hash);
      }
    }
    if ((response.headers.get("content-type") || "").includes("text/html")) {
      response.headers.set("cache-control", "public, max-age=0, must-revalidate");
    }
    response.headers.delete("set-cookie");
    response.headers.set("x-menuconnect-origin", "brian-netlify");
    return response;
  },
};
