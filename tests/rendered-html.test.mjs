import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function render(pathname) {
  const { default: worker } = await import("../dist/server/index.js");
  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("canonical screens render accessible navigation and PWA metadata", async () => {
  for (const [path, label] of [["/virdlerim", "Virdlerim"]]) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.match(html, new RegExp(`aria-label="${label}" aria-current="page"`));
    assert.match(html, /class="bottom-navigation"/);
    for (const href of ["/virdlerim", "/virdlerim/yeni", "/ayarlar"]) {
      assert.ok(html.includes(`href="${href}"`), href);
    }
    assert.match(html, /الحمد لله/);
    assert.match(html, /name="apple-mobile-web-app-capable" content="yes"/);
    assert.equal((html.match(/name="mobile-web-app-capable"/g) ?? []).length, 1);
  }
});

test("legacy section URLs redirect without stranding old links", async () => {
  for (const [path, target] of [
    ["/", "/virdlerim"],
    ...["zikirler", "dualar", "ezberler", "sureler", "siirler", "oyunlar"].map((part) => [`/${part}`, "/virdlerim"]),
  ]) {
    const response = await render(path);
    assert.ok([307, 308].includes(response.status), path);
    assert.equal(new URL(response.headers.get("location"), "http://localhost").pathname, target);
  }
});

test("shared create form and legacy edit/book routes remain reachable", async () => {
  for (const path of ["/virdlerim/yeni", "/zikirler/yeni", "/dualar/yeni", "/ezberler/yeni", "/sureler/yeni", "/siirler/yeni"]) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.match(html, /Kartın üstünde hangisi yazsın\?/);
    assert.match(html, /Günlük hedef/);
    assert.match(html, /Kategoriler/);
  }
  for (const path of ["/kitaplar", "/kitaplar/yeni", "/dualar/legacy-id/duzenle", "/sureler/legacy-id/duzenle"]) {
    assert.equal((await render(path)).status, 200, path);
  }
});

test("PWA identity stays stable while launch points at the current collection", async () => {
  const manifest = JSON.parse(await readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));
  assert.equal(manifest.id, "/");
  assert.equal(manifest.start_url, "/virdlerim");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.display, "standalone");
});

test("settings screen renders arabic typography options and basmala preview", async () => {
  const response = await render("/ayarlar");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Arapça Yazı Tipi/);
  assert.match(html, /Arapça Harekeler/);
  assert.match(html, /Yazı Boyutu/);
  assert.match(html, /Arapça Satır Aralığı/);
  assert.match(html, /Dokunma (&amp;|&) Hissiyat/);
  assert.match(html, /Günlük Tertip/);
  assert.match(html, /mehmedcelenk@gmail\.com/);
  assert.match(html, /Noto Naskh Arabic/);
  assert.match(html, /Readex Pro/);
  assert.match(html, /Almarai/);
  assert.match(html, /Amiri/);
  assert.match(html, /Scheherazade New/);
  assert.match(html, /الْحَمْدُ لِلَّهِ/);
});

test("source responsibilities stay bounded and core/data never import UI features", async () => {
  const paths = (await readdir(new URL("../app/", import.meta.url), { recursive: true })).filter((path) => /\.(css|ts|tsx)$/.test(path));
  for (const path of paths) {
    const source = await readFile(new URL(`../app/${path}`, import.meta.url), "utf8");
    assert.ok(source.split("\n").length <= 300, `${path} exceeds 300 lines`);
    if (/^(core|data)\//.test(path)) assert.doesNotMatch(source, /from ["'][^"']*(?:features|components|hooks)\//, path);
  }
  const storageLoadingSource = await readFile(new URL("../app/components/StorageLoading.tsx", import.meta.url), "utf8");
  assert.match(storageLoadingSource, /بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ/);
  assert.match(storageLoadingSource, /loading-basmala/);
});
