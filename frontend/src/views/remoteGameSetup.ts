import { Router } from '../router';
import { createWindow } from '../components/_components';
import { createTaskbar, createStaticDesktopBackground } from "../components/_components";
import { PongGame } from '../game/PongGame';
import { OneVOneStatsComponent } from '../components/_userComponents';

export function remoteGameSetupView(router: Router) {
    const root = document.getElementById("app")!;
    root.innerHTML = "";

    const staticBackground = createStaticDesktopBackground();
    staticBackground.attachToPage(root);
    const content = document.createElement("div");

    const statsContainer = document.createElement("div");
    statsContainer.className = "mb-4";

    const statsComponent = new OneVOneStatsComponent({
        container: statsContainer,
        userId: undefined, // Will use current user's stats
        width: '100%',
        height: '200px',
        showTitle: false
    });

    content.appendChild(statsContainer);

    const buttonContainer = document.createElement("div");
    buttonContainer.className = 'flex flex-col items-center gap-4 p-8 rounded-lg';

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
                router.navigate("/desktop");
            }
        }
    });

    root.appendChild(setupWindow);

    const { taskbar } = createTaskbar({
        startButton: {
            label: "Start",
            onClick: () => router.navigate("/"),
        },
        clock: true,
    });

    root.appendChild(taskbar);

    joinClassicBtn.addEventListener("click", async (e: Event) => {
        e.preventDefault();
        
        joinClassicBtn.disabled = true;
        joinClassicBtn.textContent = "Waiting for opponent...";
        joinClassicBtn.className = 'px-6 py-2 bg-gray-400 rounded-md font-bold cursor-not-allowed';

        const playerName = "Player";
        const playerId = Math.random().toString().substring(2, 7);

        try {
            const game = new PongGame(
                playerName,
                playerId,
                'classic',
                router
            );
            await game.joinGame();
        } catch (error) {
            console.error("Failed to join game:", error);
            joinClassicBtn.disabled = false;
            joinClassicBtn.textContent = "Join Online Game";
            joinClassicBtn.className = 'px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-bold';
        }
    });
}
