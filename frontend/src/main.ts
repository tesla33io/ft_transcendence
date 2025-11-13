import './styles/style.css'

import {Router} from './router'
import { AuthService } from './game/authService.ts'
import {gameView} from './views/gamePage'
import {friendsView} from './views/friendsPage'
import {loginView} from './views/loginPage'
import {profileView} from './views/profilePage'
import {registerView} from './views/registerPage'
import {tournamentView} from './views/tournamentPage'
import {guestDesktopView} from './views/guestDesktop'
import {desktopView} from './views/desktopPage'
import {localGameView} from './views/localGamePage'
import {localGameSetupView} from './views/localGameSetupPage'
import {remoteGameSetupView} from './views/remoteGameSetup'
import {aiGameSetupView} from './views/aiSetupPage.ts'
import {settingsView} from './views/settingsPage'
import { notFoundView } from './views/notFoundPage'
import { localModeSelectionView } from './views/localGameModeSelection.ts'

document.addEventListener("DOMContentLoaded", async () => {
    const router = new Router("app");

    // ===== PUBLIC ROUTES (No auth required) =====
    router.register("/", () => loginView(router));
    router.register("/login", () => loginView(router));
    router.register("/register", () => registerView(router));
    router.register("/404", () => notFoundView(router));

    // ===== GUEST-ALLOWED ROUTES (JWT required, but guest role OK) =====
    router.register("/game", () => gameView(router), { requireAuth: true });
    router.register("/tournament", () => tournamentView(router), { requireAuth: true });
    router.register("/localgame", () => localModeSelectionView(router), { requireAuth: true });
    router.register("/localgame/setup", () => localGameSetupView(router), { requireAuth: true });
    router.register("/localgame/play", () => localGameView(router), { requireAuth: true });
    router.register("/guest", () => guestDesktopView(router), { requireAuth: true });

    // ===== USER-ONLY ROUTES (JWT required, guest NOT allowed) =====
    router.register("/desktop", () => desktopView(router), { requireAuth: true, requireUser: true });
    router.register("/Desktop", () => desktopView(router), { requireAuth: true, requireUser: true });
    router.register("/friends", () => friendsView(router), { requireAuth: true, requireUser: true });
    router.register("/profile", () => profileView(router), { requireAuth: true, requireUser: true });
    router.register("/settings", () => settingsView(router), { requireAuth: true, requireUser: true });
	router.register("/onlineGame", () => remoteGameSetupView(router), { requireAuth: true, requireUser: true});
    router.register("/Ai", () => aiGameSetupView(router), { requireAuth: true, requireUser: true });

    // ===== AUTO-LOGIN CHECK =====
    const currentPath = location.pathname || "/";

    const isAuthenticated = await AuthService.checkAuth(router);
    if (isAuthenticated) {
        //console.log('[App] User is authenticated');
        
        //user is on login/register page, redirect to their desktop
        if (currentPath === '/login' || currentPath === '/register' || currentPath === '/') {
            //console.log('[App] Already logged in - redirecting to desktop');
            const landingPage = await AuthService.getLandingPage();
            router.navigate(landingPage);
        } else {
            // Navigate to the requested protected route
            //console.log(`[App] Navigating to requested page: ${currentPath}`);
            router.navigate(currentPath);
        }
    } else {
        //console.log('[App] Not authenticated');
        
        // If user is trying to access protected route, redirect to login
        if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
            //console.log('[App] Protected route requested - redirecting to login');
            router.navigate('/login');
        } else {
            // Already on public page, just navigate
            //console.log(`[App] On public page: ${currentPath}`);
            router.navigate(currentPath);
        }
    }
});