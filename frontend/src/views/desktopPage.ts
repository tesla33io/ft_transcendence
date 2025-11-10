import { Router } from "../router";
import { createTaskbar } from "../components/_components";
import { UserService } from "../game/userService";

import joystickIcon from './images/joystick.png';
import padlock from './images/padlock.png';
import remote from './images/remote.png'
import usergreen from './images/users_green.png'
import network from './images/network.png'
import spider from './images/spider.png'
import phone from './images/phone.png'
import gear from './images/gears.png'

// Define the type for icons
type IconData = {
  id: string;      // unique id to identify the icon
  title: string;   // text shown below the icon
  img: string;     // image path
  x: number;       // horizontal position
  y: number;       // vertical position
};

// Export a function that renders the desktop
export function desktopView(router: Router) {
	const root = document.getElementById("app")!;
	root.innerHTML = "";

    const staticBackgrounds = document.querySelectorAll('.static-desktop-background');
    staticBackgrounds.forEach(bg => bg.remove());

    const bodyStaticBackgrounds = document.body.querySelectorAll('.static-desktop-background');
    bodyStaticBackgrounds.forEach(bg => bg.remove());


	// the desktop container
	const desktop = document.createElement("div");
	desktop.className = "desktop";
	desktop.style.display = "flex";
	desktop.style.flexWrap = "wrap"; 
	desktop.style.flexDirection = "column";
	desktop.style.alignItems = "flex-start"; 
	desktop.style.justifyContent = "flex-start";
	desktop.style.gap = "5px"; 
	desktop.style.padding = "5px"; 
	root.appendChild(desktop);

	//icons
	const icons: IconData[] = [
		{ id: "local_game", title: "local_Pong.exe", img: joystickIcon, x: 0, y: 0 },
		{ id: "Remotepong", title: "Online_Pong.exe", img: remote, x: 0, y: 0 },
		{ id: "Ai", title: "Ai_Pong.exe", img: spider, x: 0, y: 0 },
		{ id: "tournament", title: "Tournament.exe", img: network, x: 0, y: 0 }, 
		{ id: "profile", title: "Profile.exe", img: usergreen, x: 0, y: 0 },
		{ id: "friends", title: "friends.exe", img: phone, x: 0, y: 0 },
		{ id: "settings", title: "settings.exe", img: gear, x: 0, y: 0 },
		{ id: "logout", title: "logout.exe", img: padlock, x: 0, y: 0 }
	];

	//render icons
	icons.forEach(icon => {
		const iconDiv = document.createElement("div");
		iconDiv.className = "flex flex-col items-start w-fit ";

		// Image
		const img = document.createElement("img");
		img.src = icon.img;
		img.alt = icon.title;
		img.className = "desktop-icon"
		iconDiv.appendChild(img);

		// Title
		const label = document.createElement("div");
		label.innerText = icon.title;
		label.className = "mt-2 text-white";
		iconDiv.appendChild(label);

		//Double-click to navigate
		iconDiv.addEventListener("dblclick", async () => {
			switch(icon.id) {
				case "local_game":
					router.navigate("/localgame");
					break;
				case "logout":
					try{
						console.log('try log out')
						await UserService.logout()
						console.log('logout sucesfull')
						router.navigate("/login")
					}
					catch{
						console.log("logout error", Error);
						router.navigate("/login")
					}
					break;
				case "Remotepong":
					router.navigate("/onlineGame");
					break;
				case "friends":
					router.navigate("/friends");
					break;
				case "Ai":
					router.navigate("/Ai");
					break;
				case "tournament":
					router.navigate("/tournament");
					break;
				case "profile":
					router.navigate("/profile");
					break;
				case "settings":
					router.navigate("/settings");
					break;
			}
		});

		// Append icon to desktop
		desktop.appendChild(iconDiv);
	});

	const { taskbar } = createTaskbar({
		clock: true,
		router: router
	});

	// Add the taskbar to the root
	root.appendChild(taskbar);
}
