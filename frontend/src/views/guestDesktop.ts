import { Router } from "../router";
import { createTaskbar } from "./components";

import joystickIcon from './images/joystick.png';
import padlock from './images/padlock.png';
import offline from './images/network_no.png'

// Define the type for icons
type IconData = {
  id: string;      // unique id to identify the icon
  title: string;   // text shown below the icon
  img: string;     // image path
  x: number;       // horizontal position
  y: number;       // vertical position
};

// Export a function that renders the desktop
export function guestDesktopView(router: Router) {
	//Clear the mount element (previous page disappears)
	const root = document.getElementById("app")!;
		root.innerHTML = "";

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
	{ id: "logout", title: "logout.exe", img: padlock  , x: 100, y: 100 }
  
];

	//render icons
	icons.forEach(icon => {
	const iconDiv = document.createElement("div");
	iconDiv.className = "flex flex-col items-start w-fit ";
	//iconDiv.style.left = `${icon.x}px`;
	//iconDiv.style.top = `${icon.y}px`;

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
	iconDiv.addEventListener("dblclick", () => {
	  switch(icon.id) {
		case "local_game":
		  router.navigate("/localgame");   // navigate to testsite compartment
		  break;
		case "login":
		  router.navigate("/login"); 
		  break;
	  }
	  
	});

		// Create the taskbar
	const { taskbar, taskArea } = createTaskbar({
		startButton: {
		label: "Start",
		onClick: () => alert("Start Menu Clicked!"),//add something to do there /
		},
		clock: true,
	});
	
	

	// Add the taskbar to the root
	root.appendChild(taskbar);
		


	// Append icon to desktop
	desktop.appendChild(iconDiv);
  });
}
