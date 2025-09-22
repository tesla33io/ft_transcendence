import { Router } from "../router";

import joystickIcon from './images/joystick.png';
import padlock from './images/padlock.png';
import remote from './images/remote.png'
import usergreen from './images/users_green.png'
import network from './images/network.png'
import spider from './images/spider.png'
import phone from './images/phone.png'

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
  desktop.className = "relative w-full h-full bg-teal-700 select-none";
  root.appendChild(desktop);

  //icons
  const icons: IconData[] = [
    { id: "local_game", title: "local_Pong.exe", img: joystickIcon, x: 100, y: 100 },
    { id: "logout", title: "logout.exe", img: padlock  , x: 100, y: 200 },
    { id: "Remotepong", title: "Online_Pong.exe", img: remote, x: 100, y: 300 },
	{ id: "friends", title: "friends.exe", img: phone, x: 100, y: 400 },
	{ id: "Ai", title: "Ai_Pong.exe", img: spider, x: 100, y: 400 },
	{ id: "profile", title: "Profile.exe", img: usergreen, x: 100, y: 600 },
	{ id: "tournament", title: "Tornament.exe", img: network, x: 100, y: 500 }
  ];

  //render icons
  icons.forEach(icon => {
    const iconDiv = document.createElement("div");
    iconDiv.className = "absolute w-20 text-center p-1 cursor-default";
    iconDiv.style.left = `${icon.x}px`;
    iconDiv.style.top = `${icon.y}px`;

    // Image
    const img = document.createElement("img");
    img.src = icon.img;
    img.alt = icon.title;
	img.className = "w-16 h-16 mx-auto";
    iconDiv.appendChild(img);

    // Title
    const label = document.createElement("div");
    label.innerText = icon.title;
    label.className = "mt-1 text-xs text-white";
    iconDiv.appendChild(label);

    //Double-click to navigate
    iconDiv.addEventListener("dblclick", () => {
      switch(icon.id) {
        case "local_game":
          router.navigate("/test");   // navigate to testsite compartment
          break;
        case "logout":
          router.navigate("/login");   // add some disconect handelinh here
          break;
        case "Remotepong":
          router.navigate("/test");
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
      }
    });


    // Append icon to desktop
    desktop.appendChild(iconDiv);
  });
}
