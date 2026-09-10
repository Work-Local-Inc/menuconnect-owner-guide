import test from "node:test";
import assert from "node:assert/strict";
import router from "../infra/guide-router.mjs";

test("serves the upstream bytes, preserves query, and excludes account cookies", async (t) => {
  t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(url.href, "https://menuconnect-shared-guide.netlify.app/start?lesson=orders");
    assert.equal(init.headers.has("cookie"), false);
    assert.equal(init.headers.has("authorization"), false);
    assert.equal(init.redirect, "manual");
    return new Response("Brian's original guide", { headers: { "content-type": "text/html", "set-cookie": "unused=1" } });
  });
  const response = await router.fetch(new Request("https://guide.menuconnect.ca/start?lesson=orders", { headers: { cookie: "session=private", authorization: "Bearer private" } }));
  assert.equal(await response.text(), "Brian's original guide");
  assert.equal(response.headers.has("set-cookie"), false);
  assert.match(response.headers.get("cache-control"), /max-age=0/);
});
test("old links redirect on the public domain with query and lesson preserved", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 301, headers: { location: "/start?from=email#orders" } }));
  const response = await router.fetch(new Request("https://guide.menuconnect.ca/guide?from=email"));
  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://guide.menuconnect.ca/start?from=email#orders");
});
test("a double-slash path cannot select a different upstream host", async (t) => {
  t.mock.method(globalThis, "fetch", async (url) => {
    assert.equal(url.origin, "https://menuconnect-shared-guide.netlify.app");
    return new Response(null, { status: 404 });
  });
  assert.equal((await router.fetch(new Request("https://guide.menuconnect.ca//other.example/path"))).status, 404);
});
test("HEAD remains HEAD and writes are not forwarded", async (t) => {
  let called = 0;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    called++;
    assert.equal(init.method, "HEAD");
    return new Response(null, { status: 200 });
  });
  assert.equal((await router.fetch(new Request("https://guide.menuconnect.ca/", { method: "HEAD" }))).status, 200);
  assert.equal((await router.fetch(new Request("https://guide.menuconnect.ca/", { method: "POST", body: "test" }))).status, 405);
  assert.equal(called, 1);
});
