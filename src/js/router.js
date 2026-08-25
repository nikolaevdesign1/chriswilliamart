const routes = new Map();
let current = null;

function parse(path) {
  const [, name, a, b] = path.match(/^\/work\/([^/]+)\/([^/]+)$/) ? ["", "work", ...path.slice(6).split("/")] : [null, "field"];
  return { name, params: name === "work" ? { hallId: a, workId: b } : {} };
}

function pathFor(name, params) {
  if (name === "work") return `/work/${params.hallId}/${params.workId}`;
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
  const path = pathFor(name, params);
  if (location.pathname !== path) {
    history.pushState({ name, params }, "", path);
  }
  render({ name, params });
}

export function start() {
  window.addEventListener("popstate", () => {
    render(parse(location.pathname), { fromPop: true });
  });
  render(parse(location.pathname));
}

export function currentRoute() {
  return current;
}
