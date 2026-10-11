import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin } from "vite";

export function pdfAssets(): Plugin {
  const root = resolve("node_modules/pdfjs-dist");
  const groups = ["cmaps", "standard_fonts", "wasm", "build"];
  const listAssets = async () => {
    const urls: string[] = [];
    for (const group of groups) for (const file of await readdir(resolve(root, group))) {
      if (group !== "build" || file === "pdf.worker.min.mjs") urls.push(`/pdfjs/${group}/${file}`);
    }
    return urls;
  };
  return {
    name: "local-pdf-assets",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === "/pdfjs/manifest.json") {
          res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(await listAssets())); return;
        }
        const match = /^\/pdfjs\/(cmaps|standard_fonts|wasm|build)\/([\w.-]+)$/.exec((req.url ?? "").split("?")[0]);
        if (!match) return next();
        try {
          const data = await readFile(resolve(root, match[1], match[2]));
          res.setHeader("Content-Type", match[2].endsWith(".mjs") ? "text/javascript" : match[2].endsWith(".wasm") ? "application/wasm" : "application/octet-stream");
          res.end(data);
        } catch { res.statusCode = 404; res.end(); }
      });
    },
    async generateBundle() {
      if (this.environment.name !== "client") return;
      this.emitFile({ type: "asset", fileName: "pdfjs/manifest.json", source: JSON.stringify(await listAssets()) });
      for (const group of groups) for (const file of await readdir(resolve(root, group))) {
        if (group === "build" && file !== "pdf.worker.min.mjs") continue;
        this.emitFile({ type: "asset", fileName: `pdfjs/${group}/${file}`, source: await readFile(resolve(root, group, file)) });
      }
    },
  };
}
