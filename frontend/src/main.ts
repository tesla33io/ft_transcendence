import './styles/style.css'

import {Router} from './router'
import { AuthService } from './game/AuthService.ts'
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

// ===== SESSION HEARTBEAT =====
// Send periodic heartbeat to keep session alive while browser is open
// This allows the backend to distinguish between:
// - Active session (another browser open) → block login
// - Stale session (window closed, no heartbeat) → allow re-login

let heartbeatInterval: number | null = null;

function startHeartbeat() {
    // Send heartbeat every 5 seconds
    heartbeatInterval = window.setInterval(async () => {
        try {
            // Check if we have a session cookie
            const sessionId = document.cookie
                .split('; ')
                .find(row => row.startsWith('sessionId='))
                ?.split('=')[1];
            
            if (sessionId) {
                // Send heartbeat to keep session alive
                await fetch('http://localhost:3000/users/auth/heartbeat', {
                    method: 'POST',
                    credentials: 'include', // Include cookies
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            } else {
                // No session cookie, stop heartbeat
                stopHeartbeat();
            }
        } catch (error) {
            console.error('[Heartbeat] Error:', error);
        }
    }, 5000); // Every 5 seconds
    
    console.log('[Heartbeat] Started');
}

function stopHeartbeat() {
    if (heartbeatInterval !== null) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
        console.log('[Heartbeat] Stopped');
    }
}

// Start heartbeat when authenticated
export function enableHeartbeat() {
    startHeartbeat();
}

// Stop heartbeat on logout
export function disableHeartbeat() {
    stopHeartbeat();
}

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
        // Start heartbeat for authenticated users
        startHeartbeat();  // ADD THIS LINE
        
        //user is on login/register page, redirect to their desktop
        // But allow staying on '/' (root) even when authenticated
        if (currentPath === '/login' || currentPath === '/register') {
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
