import { Router } from '../router';
import { createWindow } from '../components/_components';
import { PongGame } from '../game/PongGame';
import { createTaskbar, createStaticDesktopBackground } from "../components/_components";
//import {createTournamentStatsComponent} from "../components/_userComponents";

let currentPongGame: PongGame | undefined = undefined;


export function tournamentView(router: Router) {
	const root = document.getElementById("app")!;
	root.innerHTML = "";

	const content = document.createElement("div");
    content.style.padding = "15px";

    const staticBackground = createStaticDesktopBackground();
    staticBackground.attachToPage(root);

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

	// Form
	const form = document.createElement("form");
	form.id = "joinOnlineGameForm";
	form.className = "join-game-form mt-4";

	const label = document.createElement("label");
	label.htmlFor = "alias";
	label.textContent = "Enter your alias:";

	const input = document.createElement("input");
	input.type = "text";
	input.id = "alias";
	input.name = "alias";
	input.placeholder = " ";
	input.minLength = 1;
	input.maxLength = 20;
	input.required = true;
	input.className = " ml-4 "

	const joinClassicBtn = document.createElement("button");
	joinClassicBtn.type = "submit";
	joinClassicBtn.id = "joinBtn";
	joinClassicBtn.textContent = "Join Tournament";

	form.append(label, input, joinClassicBtn);
	content.appendChild(form);

	// Canvas (hidden until game starts)
	const canvas = document.createElement("canvas");
	canvas.id = "gameCanvas";
	canvas.width = 900;
	canvas.height = 500;
	canvas.style.display = "none";
	content.appendChild(canvas);



	const setupWindow = createWindow({
		title: "Tournament Setup",
		width: "400px",
		content: content,
		titleBarControls: {
			help: true,
			close: true,
			onClose: () => {
				currentPongGame?.disposeTornament();
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

	form.addEventListener("submit", async (e: Event) => {
    e.preventDefault();
    const alias = input.value.trim();
    if (!alias) return;

    input.disabled = true;
    input.style.backgroundColor = "#c0c0c0"; 
    input.style.color = "#808080";
    input.style.cursor = "not-allowed";

    joinClassicBtn.disabled = true;
    joinClassicBtn.textContent = "Waiting for opponent...";
    joinClassicBtn.style.cursor = "not-allowed";

    // Dispose of previous game if it exists
    if (currentPongGame) {
        currentPongGame.dispose();
        currentPongGame = undefined;
    }

    const playerId = localStorage.getItem('userId');
    if(!playerId) {
        console.log('no userid found please login again');
        
        input.disabled = false;
        input.style.backgroundColor = "";
        input.style.color = "";
        input.style.cursor = "";
        joinClassicBtn.disabled = false;
        joinClassicBtn.textContent = "Join Tournament";
        joinClassicBtn.style.cursor = "";
        return;
    }
    try {
        const game = new PongGame(
            alias,
            playerId,
            'tournament',
            router
        );
        currentPongGame = game; // Save reference for later disposal
        await game.joinGame();
    } catch (error) {
        console.error("Failed to join game:", error);
        
        input.disabled = false;
        input.style.backgroundColor = "";
        input.style.color = "";
        input.style.cursor = "";
        
        joinClassicBtn.disabled = false;
        joinClassicBtn.textContent = "Join Tournament";
        joinClassicBtn.style.cursor = "";
    }
});
}
