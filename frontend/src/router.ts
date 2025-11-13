import { UserService } from './game/userService';

export type RouteHandler = () => void;

interface RouteConfig {
  handler: RouteHandler;
  requireAuth?: boolean;
  requireUser?: boolean;
}

export class Router {
  private routes: Map<string, RouteConfig> = new Map();
  private root: HTMLElement;
  private currentPath: string = '';

  constructor(rootId: string) {
    // find the DOM element that will hold views (e.g. <div id="app"></div>)
    const el = document.getElementById(rootId);

    if (!el) throw new Error(`Root element #${rootId} not found`);
    this.root = el;

    // listen for back/forward browser buttons
    window.addEventListener("popstate", () => this.resolve());
  }

  // register a route path and its handler
  public register(
    path: string,
    handler: RouteHandler,
    options: { requireAuth?: boolean; requireUser?: boolean } = {}
  ): void {
    this.routes.set(path, {
      handler,
      requireAuth: options.requireAuth || false,
      requireUser: options.requireUser || false
    });
  }

  private isAuthenticated(): boolean {
    const token = UserService.getAuthToken();
    if (!token) {
      console.log('No auth token found');
      return false;
    }
    return true;
  }

  private async checkUserRole(): Promise<boolean> {
    try {
      const role = await UserService.getUserRoleSecure();
      if (!role) return false;

      // console.log(`User role: ${role}`);
      return role === 'user' || role === 'admin';
    } catch (error) {
      console.error('Failed to check user role:', error);
      return false;
    }
  }
  //Navigate to desktop /guest Desktop
   public async navigateToDesktop(): Promise<void> {
    console.log('[Router] Navigating to desktop...');

    if (!this.isAuthenticated()) {
      console.log('Not authenticated, going to login');
      await this.navigate('/login');
      return;
    }
    try {
      const isUser = await this.checkUserRole();

      if (isUser) {
        // console.log('User role detected → /desktop');
        await this.navigate('/desktop');
      } else {
        // console.log('Guest role detected → /guest');
        await this.navigate('/guest');
      }
    } catch (error) {
      console.error('Error determining desktop:', error);
      await this.navigate('/login');
    }
  }

  // navigate programmatically to a path (update history and show view)
  public async navigate(path: string, addToHistory = true): Promise<void> {
    // console.log(`Navigating to: ${path}`);

    let config = this.routes.get(path);
    if (!config) {
      console.warn(`Route not found: ${path}`);
      path = '/404';
      config = this.routes.get('/404');
      if (!config) return;
    }

    // Auth checks
    if (config.requireAuth || config.requireUser) {
      if (!this.isAuthenticated()) {
        console.log('Auth required → /login');
        sessionStorage.setItem('redirectAfterLogin', path);
        path = '/login';
      } else if (config.requireUser) {
        const isUser = await this.checkUserRole();
        if (!isUser) {
          // console.log('User role required → /login');
          alert('This feature requires a registered account.');
          sessionStorage.setItem('redirectAfterLogin', path);
          path = '/login';
        }
      }
    }

    const finalConfig = this.routes.get(path);
    if (!finalConfig) return;

    if (addToHistory && path !== this.currentPath) {
      history.pushState({}, "", path);
    }
    this.currentPath = path;

    // clear the root content before mounting the new view
    this.root.innerHTML = "";
    // call the handler which is expected to render into the root (or append)
    finalConfig.handler();
  }

  // internal: find the route for the current location and call its handler
  private async resolve(): Promise<void> {
    await this.navigate(location.pathname, false);
  }

  public getRedirectAfterLogin(): string {
    const redirect = sessionStorage.getItem('redirectAfterLogin');
    sessionStorage.removeItem('redirectAfterLogin');
    return redirect || '/desktop';
  }
}
