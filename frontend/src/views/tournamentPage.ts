import { Router } from '../router';
import { createWindow } from '../components/_components';
import { PongGame } from '../game/PongGame';
import { createTaskbar, createStaticDesktopBackground } from "../components/_components";
//import {createTournamentStatsComponent} from "../components/_userComponents";

let currentPongGame: PongGame | undefined = undefined;

export function tournamentView(router: Router) {
    const root = document.getElementById("app")!;
    root.innerHTML = "";

    const staticBackground = createStaticDesktopBackground();
    staticBackground.attachToPage(root);
    
    const content = document.createElement("div");

    const statsContainer = document.createElement("div");
    statsContainer.className = "mb-4";

    // ✅ Title outside the sunken box
    const titleSection = document.createElement("div");
    titleSection.style.cssText = `
        text-align: center;
        margin: 0 0 12px 0;
        padding: 12px 12px 0 12px;
    `;
    titleSection.innerHTML = `
        <h3 style="margin: 0; font-size: 22px; font-weight: bold;">
            Tournament
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
            Compete in bracket-style tournaments against 3 other players!
        </p>
        <p style="margin: 0; line-height: 1.5; font-size: 15px; color: #666"> 
            Win consecutive matches to advance through the rounds and claim the championship.
        </p>
    `;
    content.appendChild(infoSection);

    content.appendChild(statsContainer);

    const buttonContainer = document.createElement("div");
    buttonContainer.className = 'flex flex-col items-center';
    buttonContainer.style.cssText = `
        padding: 0 12px 12px 12px;
    `;

    const joinClassicBtn = document.createElement("button");
    joinClassicBtn.type = "submit";
    joinClassicBtn.id = "joinBtn";
    joinClassicBtn.textContent = "Join Tournament";
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
        title: "Tournament Setup",
        width: "400px",
        height: "280px", // ✅ Same height as AI page
        content: content,
        titleBarControls: {
            help: true,
            close: true,
            onClose: () => {
                if (currentPongGame) {
                    currentPongGame.dispose();
                    currentPongGame = undefined;
                }
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
        joinClassicBtn.textContent = "Waiting for tournament...";
        joinClassicBtn.className = 'px-6 py-2 bg-gray-400 rounded-md font-bold cursor-not-allowed';

        const playerName = localStorage.getItem('username') || "Player";
        const playerId = localStorage.getItem('userId');
        
        if (!playerId) {
            console.log('no userid found please login again');
            joinClassicBtn.disabled = false;
            joinClassicBtn.textContent = "Join Tournament";
            joinClassicBtn.className = 'px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-bold';
            return;
        }

        try {
            const game = new PongGame(
                playerName,
                playerId,
                'tournament',
                router
            );
            currentPongGame = game;
            await game.joinGame();
        } catch (error) {
            console.error("Failed to join tournament:", error);
            joinClassicBtn.disabled = false;
            joinClassicBtn.textContent = "Join Tournament";
            joinClassicBtn.className = 'px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-bold';
        }
    });
}
