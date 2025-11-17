import { Router } from '../router';
import { createWindow } from '../components/_components';
import { createTaskbar, createStaticDesktopBackground } from "../components/_components";
import { PongGame } from '../game/PongGame';
//import { OneVOneStatsComponent } from '../components/_userComponents';

let currentPongGame: PongGame | undefined = undefined;

export function remoteGameSetupView(router: Router) {
    const root = document.getElementById("app")!;
    root.innerHTML = "";

    const staticBackground = createStaticDesktopBackground();
    staticBackground.attachToPage(root);
    const content = document.createElement("div");

    const titleSection = document.createElement("div");
    titleSection.style.cssText = `
        text-align: center;
        margin: 0 0 12px 0;
        padding: 12px 12px 0 12px;
    `;
    titleSection.innerHTML = `
        <h3 style="margin: 0; font-size: 22px; font-weight: bold;">
            Online Game
        </h3>
    `;
    content.appendChild(titleSection);

    const infoSection = document.createElement("div");
    infoSection.className = "sunken-panel";
    infoSection.style.cssText = `
        padding: 12px;
        margin: 0 12px 12px 12px;
        background: #e0e0e0;
        text-align: center;
    `;
    infoSection.innerHTML = `
        <p style="margin: 0 0 8px 0; line-height: 1.5; font-size: 15px; color: #666">
            Play One vs One against Real Players
        </p>
        <p style="margin: 0; line-height: 1.5; font-size: 15px; color: #666">
            Challenge real players in competitive matches and prove you're the ultimate Pong champion.
        </p>
    `;
    content.appendChild(infoSection);

    const buttonContainer = document.createElement("div");
    buttonContainer.className = 'flex flex-col items-center gap-4 p-4 rounded-lg';

    const joinClassicBtn = document.createElement("button");
    joinClassicBtn.type = "submit";
    joinClassicBtn.id = "joinBtn";
    joinClassicBtn.textContent = "Join Online Game";

    joinClassicBtn.className = 'px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-bold';

    buttonContainer.appendChild(joinClassicBtn);
    content.appendChild(buttonContainer);

    const canvas = document.createElement("canvas");
    canvas.id = "gameCanvas";
    canvas.width = 900;
    canvas.height = 500;
    canvas.style.display = "none";
    content.appendChild(canvas);


    const setupWindow = createWindow({
        title: "Online Game Setup",
        width: "400px",
        height: "300px",
        content: content,
        titleBarControls: {
            help: true,
            close: true,
            onClose: () => {
                currentPongGame?.dispose();
                router.navigateToDesktop();
            }
        }
    });

    root.appendChild(setupWindow);

    const { taskbar } = createTaskbar({
		clock: true,
		router: router
	});

    root.appendChild(taskbar);

    joinClassicBtn.addEventListener("click", async (e: Event) => {
        e.preventDefault();

        joinClassicBtn.disabled = true;
        joinClassicBtn.textContent = "Waiting for opponent...";
        joinClassicBtn.className = 'px-6 py-2 bg-gray-400 rounded-md font-bold cursor-not-allowed';

        const playerName = localStorage.getItem('username') || "Player";

		const playerId = localStorage.getItem('userId');
		if(!playerId) {
			console.log('no userid found please login again');
			return;
		}
        try {
            const game = new PongGame(
                playerName,
                playerId,
                'classic',
                router
            );
            currentPongGame = game
            await game.joinGame();
        } catch (error) {
            console.error("Failed to join game:", error);
            joinClassicBtn.disabled = false;
            joinClassicBtn.textContent = "Join Online Game";
            joinClassicBtn.className = 'px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-bold';
        }
    });
}
