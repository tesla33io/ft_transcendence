import './style.css'
import {Router} from './router'
import {testingPage} from './views/testing_page'
import {HomePage} from './views/homepage'

// dev-only console overlay
if (import.meta.env.DEV) {
  import("./game/devConsole").then(({ DevConsole }) => {
    new DevConsole();
  });
}


document.addEventListener("DOMContentLoaded", () => {
	const router = new Router("app");
	//router.register("/", () => HomePage(router));
	router.register("/", () => HomePage(router));
	router.register("/testingSite", () => testingPage());
	router.navigate(location.pathname || "/");
});
