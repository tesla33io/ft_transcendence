import { Router } from "../router";
import { createTaskbar, createWindow } from "../components/_components";
import { UserService } from '../game/userService'; 
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
  enabled: boolean; // enabled property for logout turnament and localgame
};

// Export a function that renders the desktop
export function guestDesktopView(router: Router) {
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

    const icons: IconData[] = [
        { id: "local_game", title: "local_Pong.exe", img: joystickIcon, x: 0, y: 0, enabled: true },
        { id: "Remotepong", title: "Online_Pong.exe", img: remote, x: 0, y: 0, enabled: false },
        { id: "Ai", title: "Ai_Pong.exe", img: spider, x: 0, y: 0, enabled: false },
        { id: "tournament", title: "Tournament.exe", img: network, x: 0, y: 0, enabled: true }, 
        { id: "profile", title: "Profile.exe", img: usergreen, x: 0, y: 0, enabled: false },
        { id: "friends", title: "friends.exe", img: phone, x: 0, y: 0, enabled: false },
        { id: "settings", title: "settings.exe", img: gear, x: 0, y: 0, enabled: false },
        { id: "logout", title: "logout.exe", img: padlock, x: 0, y: 0, enabled: true }
    ];

    icons.forEach(icon => {
        const iconDiv = document.createElement("div");
        iconDiv.className = "flex flex-col items-start w-fit";

    
        if (!icon.enabled) {
            iconDiv.title = "Login required to access this feature";
            iconDiv.style.cursor = "not-allowed"; // Show not-allowed cursor
        } else {
            iconDiv.style.cursor = ""; // Normal pointer for enabled icons
        }

        // Image
        const img = document.createElement("img");
        img.src = icon.img;
        img.alt = icon.title;
        img.className = "desktop-icon";
        iconDiv.appendChild(img);

        // Title
        const label = document.createElement("div");
        label.innerText = icon.title;
        label.className = "mt-2 text-white";
        iconDiv.appendChild(label);

        iconDiv.addEventListener("dblclick", () => {
            if (!icon.enabled) {
                showErrorDialog("Login required to access this feature");
                return; // Don't navigate
            }

            // Navigation only for enabled icons
            switch(icon.id) {
                case "local_game":
                    router.navigate("/localgame");
                    break;
                case "tournament":
                    router.navigate("/tournament");
                    break;
                case "logout":
                    void (async () => {
                        try {
                          await UserService.logout();      // destroys the session server-side
                        } catch (err) {
                          console.error('Logout failed', err);
                        } finally {
                          router.navigate('/login');       // now safe—session is gone
                        }
                    })(); 
                    break;
            }
        });

        // Append icon to desktop
        desktop.appendChild(iconDiv);
    });

    const { taskbar } = createTaskbar({
        startButton: {
            label: "Start",
            onClick: () => router.navigate("/"),
        },
        clock: true,
    });

    // Add the taskbar to the root
    root.appendChild(taskbar);
}

function showErrorDialog(message: string) {
    
    const existingDialog = document.querySelector('.error-dialog-window');
    if (existingDialog) {
        existingDialog.remove();
    }

    const backdrop = document.createElement('div');
    backdrop.className = 'error-dialog-backdrop';
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0,0,0,0.3);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    // Create content for the window
    const content = document.createElement('div');
    content.style.cssText = `
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
        text-align: center;
    `;

    // Icon and message
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 12px;
    `;
    messageDiv.innerHTML = `
        <span style="font-size: 32px;"></span>
        <span>${message}</span>
    `;

    // OK button
    const okBtn = document.createElement('button');
    okBtn.textContent = 'OK';
    okBtn.style.cssText = `
        background: #c0c0c0;
        border: 2px outset #c0c0c0;
        padding: 6px 20px;
        cursor: pointer;
        font-size: 11px;
        min-width: 60px;
    `;

    okBtn.onmouseover = () => {
        okBtn.style.backgroundColor = '#d0d0d0';
    };
    okBtn.onmouseout = () => {
        okBtn.style.backgroundColor = '#c0c0c0';
    };

    okBtn.onclick = () => {
        backdrop.remove();
    };

    content.appendChild(messageDiv);
    content.appendChild(okBtn);

    const errorWindow = createWindow({
        title: "Access Denied",
        width: "320px",
        height: "150px",
        content: content,
        initialPosition: { 
            x: (window.innerWidth / 2) - 160, 
            y: (window.innerHeight / 2) - 75 
        },
        titleBarControls: {
            close: true,
            onClose: () => {
                backdrop.remove();
            }
        }
    });

    // add custom class for identification
    errorWindow.classList.add('error-dialog-window');

    // add window to backdrop
    backdrop.appendChild(errorWindow);
    document.body.appendChild(backdrop);

    // Auto-close 
    setTimeout(() => {
        if (backdrop.parentNode) {
            backdrop.remove();
        }
    }, 5000);

   
}
