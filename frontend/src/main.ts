import './styles/style.css'
import {Router} from './router'
import {testingPage} from './views/testing_page'
import {HomePage} from './views/homepage'
import {gameView} from './views/gamePage'
import {friendsView} from './views/friendsPage'
import {friendsProfileView} from './views/friendsProfile'
import {loginView} from './views/loginPage'
import {profileView} from './views/profilePage'
import {registerView} from './views/registerPage'
import {tournamentView} from './views/tournamentPage'
import {tournamentRoomView} from './views/tournamentRoomPage'
import {guestDesktopView} from './views/guestDesktop'
import {desktopView} from './views/desktopPage'
/*// devconsole overlay
if (import.meta.env.DEV) {
  import("./game/devConsole").then(({ DevConsole }) => {
    new DevConsole();
  });
}
*/

document.addEventListener("DOMContentLoaded", () => {
	const router = new Router("app");

	router.register("/", () => loginView(router));
	router.register("/homepage", () => HomePage(router));
	router.register("/test", () => testingPage(router));
	router.register("/game", () => gameView(router));
	router.register("/friends",() => friendsView(router));
	router.register("/friendsProfile", () => friendsProfileView(router));
	router.register("/login",() => loginView(router));
	router.register("/profile",() => profileView(router));
	router.register("/register",() => registerView());
	router.register("/tournament", () => tournamentView(router));
	router.register("/tournamentRoom",() => tournamentRoomView());
	router.register("/guest", () => guestDesktopView(router));
	router.register("/desktop", () => desktopView(router));

	router.navigate(location.pathname || "/");
});
