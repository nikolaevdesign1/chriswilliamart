import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const root = import.meta.dirname;

// The gallery is one page: about, contacts and list are routes inside it, so
// sound and state carry across without a reload. For a direct visit to one
// of those addresses on a plain static host, the built page is also written
// out as <route>/index.html.
const ROUTES = ["about", "contacts", "list", ...workRoutes()];

// Every work gets its own folder too, so a shared link to a painting is a
// real page (HTTP 200) and not the host's 404 fallback. Read straight from
// the data file: it uses import.meta.glob, so it can't be imported here.
function workRoutes() {
  const source = readFileSync(resolve(import.meta.dirname, "src/data/halls.js"), "utf8");
  const routes = [];
  let hall = null;
  for (const line of source.split("\n")) {
    const hallMatch = line.match(/^ {4}id: "([^"]+)",/);
    if (hallMatch) hall = hallMatch[1];
    const workMatch = line.match(/work\("[^"]+", "([^"]+)"/);
    if (workMatch && hall) routes.push(`work/${hall}/${workMatch[1]}`);
  }
  return routes;
}

// Deploy settings, passed in by CI (see .github/workflows/deploy.yml):
// BASE_PATH is the sub-path the site is served from ("/repo/" on GitHub
// Pages), SITE_URL its full address, used where a URL must be absolute.
const BASE_PATH = process.env.BASE_PATH || "/";
const SITE_URL = process.env.SITE_URL || "";

// Social previews need absolute image URLs.
function absoluteMeta() {
  return {
    name: "absolute-meta",
    apply: "build",
    // After Vite's own pass, which has already prefixed the base path.
    transformIndexHtml: {
      order: "post",
      handler(html) {
        if (!SITE_URL) return html;
        return html.replace(/content="[^"]*\/og-image\.jpg"/g, `content="${SITE_URL}og-image.jpg"`);
      },
    },
  };
}

function routeFolders() {
  let outDir;
  return {
    name: "route-folders",
    apply: "build",
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    // After the write, not during bundling: the HTML is only final once
    // Vite's own html plugin has run.
    writeBundle() {
      const page = resolve(outDir, "index.html");
      if (!existsSync(page)) return;
      ROUTES.forEach((route) => {
        mkdirSync(resolve(outDir, route), { recursive: true });
        copyFileSync(page, resolve(outDir, route, "index.html"));
      });
      // Any other address (a work page opened directly) falls through to the
      // host's 404 page; making that the app lets the router take over.
      copyFileSync(page, resolve(outDir, "404.html"));
    },
  };
}

export default defineConfig({
  base: BASE_PATH,
  plugins: [absoluteMeta(), routeFolders()],
  server: {
    watch: {
      // macOS touches a file's metadata whenever it is opened, so every image
      // the page loaded looked "changed" to the watcher and forced a reload , 
      // in a loop. Artwork doesn't need live reload; restart after adding some.
      ignored: ["**/src/assets/**"],
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        welcome: resolve(root, "welcome.html"),
      },
    },
  },
});
