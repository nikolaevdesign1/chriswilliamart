const routes = new Map();
let current = null;

function parse(path) {
  const workMatch = path.match(/^\/work\/([^/]+)\/([^/]+)$/);
  if (workMatch) return { name: "work", params: { hallId: workMatch[1], workId: workMatch[2] } };
  if (path === "/list") return { name: "list", params: {} };
  return { name: "field", params: {} };
}

function pathFor(name, params) {
  if (name === "work") return `/work/${params.hallId}/${params.workId}`;
  if (name === "list") return "/list";
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
