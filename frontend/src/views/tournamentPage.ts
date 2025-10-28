import { Router } from '../router';
import { createWindow } from '../components/_components';
import { PongGame } from '../game/PongGame';
import { createTaskbar, createStaticDesktopBackground } from "../components/_components";
import {createTournamentStatsComponent} from "../components/_userComponents";

let currentPongGame: PongGame | undefined = undefined;

export function tournamentView(router: Router) {
	const root = document.getElementById("app")!;
	root.innerHTML = "";

	const content = document.createElement("div");
    content.style.padding = "15px";

    const staticBackground = createStaticDesktopBackground();
    staticBackground.attachToPage(root);

    const statsContainer = document.createElement("div");
    statsContainer.style.cssText = `
        flex-shrink: 0;
        height: 140px;
    `;
	
	const tournamentStatsComponent = createTournamentStatsComponent({
        container: statsContainer,
        userId: undefined, // Will use current user's stats
        width: '100%',
        height: '140px',
        showTitle: true
    });

    content.appendChild(statsContainer);


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
				window.history.back();
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

	form.addEventListener("submit", async (e: Event) => {
		e.preventDefault();
		const alias = input.value.trim();
		if (!alias) return;

		joinClassicBtn.disabled = true;
		joinClassicBtn.textContent = "Waiting for opponent...";

		// Dispose of previous game if it exists
		if (currentPongGame) {
			currentPongGame.dispose();
			currentPongGame = undefined;
		}

		const playerId = Math.random().toString().substring(2, 7);

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
			joinClassicBtn.disabled = false;
			joinClassicBtn.textContent = "Join Online Game";
		}
	});
}