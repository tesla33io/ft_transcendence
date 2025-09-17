import './style.css'
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

/*// dev-only console overlay
if (import.meta.env.DEV) {
  import("./game/devConsole").then(({ DevConsole }) => {
    new DevConsole();
  });
}
*/

document.addEventListener("DOMContentLoaded", () => {
	const router = new Router("app");
	router.register("/", () => HomePage(router));
	router.register("/homepage", () => HomePage(router));
	router.register("/test", () => testingPage(router));
	router.register("/game", () => gameView());
	router.register("/friends",() => friendsView());
	router.register("/friendsProfile", () => friendsProfileView());
	router.register("/login",() => loginView());
	router.register("/profile",() => profileView());
	router.register("/register",() => registerView());
	router.register("/tournament", () => tournamentView());
	router.register("/tournamentRoom",() => tournamentRoomView());
	router.navigate(location.pathname || "/");
});
