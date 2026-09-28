import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { test } from "node:test";

test("service worker returns cached reader code, worker, fonts and shell when offline", async () => {
  const source = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
  const handlers = new Map<string, (event: { request: Request; respondWith: (response: Promise<Response>) => void }) => void>();
  const cached = new Map<string, Response>();
  for (const path of ["/virdlerim", "/assets/PdfReader.js", "/assets/EpubReader.js", "/pdfjs/build/pdf.worker.min.mjs", "/pdfjs/standard_fonts/LiberationSans-Regular.ttf"]) {
    cached.set(`https://example.test${path}`, new Response(`cached:${path}`));
  }
  runInNewContext(source, {
    self: { location: { origin: "https://example.test" }, addEventListener: (name: string, fn: typeof handlers extends Map<string, infer V> ? V : never) => handlers.set(name, fn) },
    caches: { match: async (request: Request | string) => cached.get(typeof request === "string" ? new URL(request, "https://example.test").href : request.url)?.clone() },
    fetch: async () => { throw new Error("Offline"); }, URL, Response,
  });
  for (const [url] of cached) {
    let response!: Promise<Response>;
    handlers.get("fetch")!({ request: new Request(url), respondWith: value => { response = value; } });
    assert.equal(await (await response).text(), `cached:${new URL(url).pathname}`);
  }
});
