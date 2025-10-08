
import './styles/style.css'
import {Router} from './router'
import {gameView} from './views/gamePage'
import {friendsView} from './views/friendsPage'
import {friendsProfileView} from './views/friendsProfile'
import {loginView} from './views/loginPage'
import {profileView} from './views/profilePage'
import {registerView} from './views/registerPage'
import {tournamentView} from './views/tournamentPage'
import {guestDesktopView} from './views/guestDesktop'
import {desktopView} from './views/desktopPage'
import {localGameView} from './views/localGamePage'
import {localGameSetupView} from './views/localGameSetupPage'
import {remoteGameSetupView} from './views/remoteGameSetup'


document.addEventListener("DOMContentLoaded", () => {
	const router = new Router("app");
	router.register("/", () => loginView(router));
	router.register("/og", () => remoteGameSetupView(router));
	router.register("/game", () => gameView(router));
	router.register("/friends",() => friendsView(router));
	router.register("/friendsProfile", () => friendsProfileView(router));
	router.register("/login",() => loginView(router));
	router.register("/profile",() => profileView(router));
	router.register("/register",() => registerView(router));
	router.register("/tournament", () => tournamentView(router));
	router.register("/guest", () => guestDesktopView(router));
	router.register("/desktop", () => desktopView(router));
	router.register("/localgame", () => localGameSetupView(router));
	router.register("/localgame/play", () => localGameView(router));



	router.navigate(location.pathname || "/");
});
