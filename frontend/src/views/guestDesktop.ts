import { Router } from "../router";

import joystickIcon from './images/joystick.png';
import key_win from './images/key_win.png';

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
  desktop.className = "relative w-full h-full bg-teal-700 select-none";
  root.appendChild(desktop);

  //icons
  const icons: IconData[] = [
    { id: "local_game", title: "local_Pong.exe", img: joystickIcon, x: 100, y: 100 },
    { id: "login", title: "login.exe", img: key_win , x: 100, y: 200 },
    //{ id: "mycomputer", title: "My Computer", img: "/icons/mycomputer.png", x: 50, y: 250 },
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

    // 4b️⃣ Title
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
        case "login":
          router.navigate("/login");   // navigate to settings compartment
          break;
        case "mycomputer":
          router.navigate("/mycomputer"); // hypothetical page
          break;
      }
    });


    // Append icon to desktop
    desktop.appendChild(iconDiv);
  });
}
