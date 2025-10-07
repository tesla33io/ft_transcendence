import { Router } from "../router";
import { createTaskbar } from "./components";

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
	//Clear the mount element (previous page disappears)
	const root = document.getElementById("app")!;
		root.innerHTML = "";

	// the desktop container
	const desktop = document.createElement("div");
	desktop.className = "desktop";
	desktop.style.display = "flex";
	desktop.style.flexWrap = "wrap"; // Allows wrapping to a new column
	desktop.style.flexDirection = "column"; // Stack items top-to-bottom first
	desktop.style.alignItems = "flex-start"; // Align items to the left
	desktop.style.justifyContent = "flex-start"; // Align items to the top
	desktop.style.gap = "5px"; // Add spacing between icons
	desktop.style.padding = "5px"; // Add padding around the desktop
	root.appendChild(desktop);

  //icons
  const icons: IconData[] = [
    { id: "local_game", title: "local_Pong.exe", img: joystickIcon, x: 0, y: 0 },
    { id: "Remotepong", title: "Online_Pong.exe", img: remote, x: 0, y: 0 },
    { id: "Ai", title: "Ai_Pong.exe", img: spider, x: 0, y: 0 },
	  { id: "tournament", title: "Tornament.exe", img: network, x: 0, y: 0 }, 
	  { id: "profile", title: "Profile.exe", img: usergreen, x: 0, y: 0 },
    { id: "friends", title: "friends.exe", img: phone, x: 0, y: 0 },
    { id: "settings", title: "settings.exe", img: gear, x: 0, y: 0 },
    { id: "logout", title: "logout.exe", img: padlock  , x: 0, y: 0 }
  
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
        case "logout":
          router.navigate("/login");   // add some disconect handelinh here
          break;
        case "Remotepong":
          router.navigate("/og");
          break;
		case "friends":
          router.navigate("/friends");
          break;
		case "tournament":
          router.navigate("/tournament");
          break;
		case "profile":
          router.navigate("/profile");
          break;
    case "settings":
          router.navigate("/setings");
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
