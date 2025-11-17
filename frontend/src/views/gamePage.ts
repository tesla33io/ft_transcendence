import { Router } from "../router";
import { createWindow } from "../components/_components";
import { createTaskbar,createStaticDesktopBackground } from "../components/_components";
import type { WebSocketHandler } from "../game/websocketHandler";

export function gameView(router: Router, wsHandler: WebSocketHandler, gameMode?: string) {
	const root = document.getElementById("app")!;
	root.innerHTML = "";

	const content = document.createElement("div");

	// Header with scores
	const header = document.createElement("div");
	header.className = "game-header";

	const scoreBoard = document.createElement("div");
	scoreBoard.className = "score-board";

	// Create opponent info
	const opponentInfo = document.createElement("div");
	opponentInfo.className = "player-info";

	const opponentName = document.createElement("span");
	opponentName.id = "opponent-name";
	opponentName.textContent = "Opponent";

	const opponentScore = document.createElement("span");
	opponentScore.id = "opponent-score";
	opponentScore.textContent = "0";

	opponentInfo.appendChild(opponentName);
	opponentInfo.appendChild(opponentScore);

	// Create VS text
	const vsText = document.createElement("div");
	vsText.className = "vs";
	vsText.textContent = "VS";

	// Create player info
	const playerInfo = document.createElement("div");
	playerInfo.className = "player-info";

	const playerName = document.createElement("span");
	playerName.id = "player-name";
	playerName.textContent = "Player";

	const playerScore = document.createElement("span");
	playerScore.id = "player-score";
	playerScore.textContent = "0";

	playerInfo.appendChild(playerName);
	playerInfo.appendChild(playerScore);

	// Assemble the scoreboard
	scoreBoard.appendChild(opponentInfo);
	scoreBoard.appendChild(vsText);
	scoreBoard.appendChild(playerInfo);

	header.appendChild(scoreBoard);
	content.appendChild(header);

	// Game canvas container
	const gameContainer = document.createElement("div");
	gameContainer.className = "game-container";

	const canvas = document.createElement("canvas");
	canvas.id = "gameCanvas";
	canvas.width = 900;
	canvas.height = 550;
	gameContainer.appendChild(canvas);

	content.appendChild(gameContainer);

	// Create the main game window
	const gameWindow = createWindow({
		title: "Pong Game",
		width: "920px",
		height: "620px",
		content: content,
		titleBarControls: {
			close: true,
			onClose: () => {
				if (wsHandler)
					wsHandler.disconnect();
				router.navigateToDesktop();
			}
		}
	});

	root.appendChild(gameWindow);

	// Helper functions to control game window close button
	const hideGameWindowCloseButton = () => {
		const closeButton = gameWindow.querySelector('.title-bar-controls button') as HTMLElement;
		if (closeButton) {
			closeButton.style.display = 'none';
		}
	};

	const showGameWindowCloseButton = () => {
		const closeButton = gameWindow.querySelector('.title-bar-controls button') as HTMLElement;
		if (closeButton) {
			closeButton.style.display = '';
		}
	};

		// Create the taskbar
		const { taskbar } = createTaskbar({
			clock: true,
			router: router
		});
		// Add the taskbar to the root
		root.appendChild(taskbar);

		const staticBackground = createStaticDesktopBackground();
		staticBackground.attachToPage(root);

	// Result window (separate window)
	let resultWindow: HTMLElement | null = null;

	const showGameResult = (isWin: boolean, finalScore: string) => {
		// Hide the game window close button
		hideGameWindowCloseButton();

		// Create result content
		const resultContent = document.createElement("div");
		resultContent.className = "window-body flex flex-col items-center justify-center p-3"; // Reduced padding

		// Win/Lose text
		const resultText = document.createElement("h2");
		resultText.textContent = isWin ? "YOU WON!" : "YOU LOST!";
		resultText.className = "text-lg font-bold text-center mb-2"; // Smaller text, less margin
		resultText.style.color = isWin ? "#010081" : "#ff0000";

		// Score text
		const resultScore = document.createElement("p");
		resultScore.textContent = finalScore;
		resultScore.className = "text-base font-semibold text-center mb-2"; // Smaller text, less margin

		// Opponent name (get it from the current displayed name)
		const opponentNameElement = document.getElementById("opponent-name");
		const opponentName = opponentNameElement ? opponentNameElement.textContent : "Opponent";

		const opponentText = document.createElement("p");
		opponentText.textContent = `against ${opponentName}`; // Shorter "vs" instead of "against"
		opponentText.className = "text-xs text-center mb-3 text-gray-600"; // Smaller text



		// Add elements to content
		resultContent.appendChild(resultText);
		resultContent.appendChild(resultScore);
		resultContent.appendChild(opponentText);


		// Create result window (slightly bigger)
		resultWindow = createWindow({
			title: "Game Result",
			width: "320px",    // Increased from 280px
			height: "240px",   // Increased from 220px
			content: resultContent,
			initialPosition: { x: 300, y: 300 },
			titleBarControls: {
				close: true,
				onClose: () => {
					if (resultWindow) {
						resultWindow.remove();
						resultWindow = null;
					}
					// Show the game window close button again when result window is closed
					showGameWindowCloseButton();
				}
			}
		});
		if (gameMode === 'tournament' && isWin) {
			hideGameWindowCloseButton();
           const waitingText = document.createElement("p");
            waitingText.textContent = "Waiting for other players to finish...";
            waitingText.className = "text-xs text-center text-gray-600 mt-2";
            resultContent.appendChild(waitingText);
        } else {

			 const backToMenuBtn = document.createElement("button");
            backToMenuBtn.textContent = "Menu";
            backToMenuBtn.className = "button px-2 py-1 text-xs";
            backToMenuBtn.addEventListener("click", () => {
                router.navigate("/desktop");
            });
            resultContent.appendChild(backToMenuBtn);
        }
		// Add high z-index with Tailwind
		resultWindow.style.zIndex = "50000";
		root.appendChild(resultWindow);
	};

	const hideGameResult = () => {
		if (resultWindow) {
			resultWindow.remove();
			resultWindow = null;
		}
		// Show the game window close button again
		showGameWindowCloseButton();
	};

	return {
		canvas,
		updateScore: (playerScore: number, opponentScore: number) => {
			document.getElementById("player-score")!.textContent = playerScore.toString();
			document.getElementById("opponent-score")!.textContent = opponentScore.toString();
		},
		updatePlayers: (playerName: string, opponentName: string) => {
			document.getElementById("player-name")!.textContent = playerName;
			document.getElementById("opponent-name")!.textContent = opponentName;
		},
		showGameResult,
		hideGameResult
	};
}
