const routes = new Map();
let current = null;

// The site may live under a sub-path (GitHub Pages serves it at
// /<repo>/), set at build time through Vite's base. Routes are written
// without it; it's added on the way out and stripped on the way in.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/** An app path ("/about", "/work/a/b") as a real URL on this host. */
export function url(path) {
  return BASE + path;
}

function stripBase(pathname) {
  if (BASE && pathname.startsWith(BASE)) return pathname.slice(BASE.length) || "/";
  return pathname;
}

function parse(fullPath) {
  const path = stripBase(fullPath);
  const workMatch = path.match(/^\/work\/([^/]+)\/([^/]+)$/);
  if (workMatch) return { name: "work", params: { hallId: workMatch[1], workId: workMatch[2] } };
  // Trailing slash and .html spellings too: the build writes each route out
  // as its own folder so a static host can serve it on a direct visit.
  const page = path.replace(/\/$/, "").replace(/\.html$/, "");
  if (page === "/list") return { name: "list", params: {} };
  if (page === "/about") return { name: "about", params: {} };
  if (page === "/contacts") return { name: "contacts", params: {} };
  return { name: "field", params: {} };
}

function pathFor(name, params) {
  if (name === "work") return `/work/${params.hallId}/${params.workId}`;
  if (name === "list") return "/list";
  if (name === "about") return "/about";
  if (name === "contacts") return "/contacts";
  return "/";
}

export function onRoute(name, handler) {
  routes.set(name, handler);
}

function render(route, { fromPop = false } = {}) {
  current = route;
  const handler = routes.get(route.name);
  if (handler) handler(route.params, { fromPop });
}

export function navigate(name, params = {}) {
  const path = url(pathFor(name, params));
  if (location.pathname !== path) {
    history.pushState({ name, params }, "", path);
  }
  render({ name, params });
}

// Links written in the HTML ("/about") get the base prefixed once, so opening
// them in a new tab or copying them gives the real address.
function rebaseLinks() {
  if (!BASE) return;
  document.querySelectorAll('a[href^="/"]').forEach((link) => {
    const href = link.getAttribute("href");
    if (!href.startsWith(BASE + "/")) link.setAttribute("href", url(href));
  });
}

export function start() {
  rebaseLinks();
  window.addEventListener("popstate", () => {
    render(parse(location.pathname), { fromPop: true });
  });
  render(parse(location.pathname));
}

export function currentRoute() {
  return current;
}
