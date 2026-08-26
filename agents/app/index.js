// agents/app/index.js — menyajikan hasil build React (folder build/) sebagai
// satu file HTML self-contained di route /app, sehingga UI & API berada di
// origin yang sama (port 8088) persis seperti saat di-deploy ke EdgeOne.
import fs from "node:fs";
import path from "node:path";

let cachedHtml = null;
let cachedMtime = 0;

function readBuildFile(relPath) {
  return fs.readFileSync(path.join(process.cwd(), "build", relPath), "utf-8");
}

function buildInlinedHtml() {
  const buildDir = path.join(process.cwd(), "build");
  const indexStat = fs.statSync(path.join(buildDir, "index.html"));
  if (cachedHtml && indexStat.mtimeMs === cachedMtime) return cachedHtml;

  let html = readBuildFile("index.html");

  // Inline CSS: <link rel="stylesheet" href="...css">
  html = html.replace(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, (match, href) => {
    try {
      const css = readBuildFile(href.replace(/^\.?\//, ""));
      return `<style>${css}</style>`;
    } catch {
      return match;
    }
  });

  const scripts = [];
  html = html.replace(/<script[^>]*src="([^"]+\.js)"[^>]*><\/script>/g, (match, src) => {
    try {
      let code = readBuildFile(src.replace(/^\.?\//, ""));
      code = code.replace(/\/\/# sourceMappingURL=.*$/gm, "");
      scripts.push(code);
      return `<!-- inlined: ${src} -->`;
    } catch {
      return match;
    }
  });
  if (scripts.length) {
    html = html.replace(
      "</body>",
      `<script>${scripts.join("\n;\n")}</script>\n</body>`,
    );
  }

  cachedHtml = html;
  cachedMtime = indexStat.mtimeMs;
  console.log(`[app] UI served (${(html.length / 1024).toFixed(0)} KB inlined)`);
  return html;
}

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const html = buildInlinedHtml();
    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e) {
    return new Response(
      `<h1>UI belum tersedia</h1><p>Jalankan <code>npm run build</code> terlebih dahulu, lalu restart server.</p><pre>${e.message}</pre>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }
}
