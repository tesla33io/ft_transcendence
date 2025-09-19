export type RouteHandler = () => void;

export class Router {
  private routes: Record<string, RouteHandler> = {}; // map of path -> handler
  private root: HTMLElement;                           // DOM node where views are mounted

  constructor(rootId: string) {
    // find the DOM element that will hold views (e.g. <div id="app"></div>)
    const el = document.getElementById(rootId);
    if (!el) throw new Error(`Root element #${rootId} not found`);
    this.root = el;

    // listen for back/forward browser buttons
    window.addEventListener("popstate", () => this.resolve());
  }

  // register a route path and its handler
  public register(path: string, handler: RouteHandler): void {
    this.routes[path] = handler;
  }

  // navigate programmatically to a path (update history and show view)
  public navigate(path: string): void {
    // push the new entry into browser history (no page reload)
    history.pushState({}, "", path);
    // render the appropriate view for the new location
    this.resolve();
  }

  // internal: find the route for the current location and call its handler
  private resolve(): void {
    const path = location.pathname;      // current URL path (e.g. "/game")
    const handler = this.routes[path];   // look up the handler

    // clear the root content before mounting the new view
    this.root.innerHTML = "";

    if (handler) {
      // call the handler which is expected to render into the root (or append)
      handler();
    } else {
      // fallback 404 content if no route matches
      this.root.innerHTML = "<h2>404 - Page not found</h2>";
    }
  }
}
