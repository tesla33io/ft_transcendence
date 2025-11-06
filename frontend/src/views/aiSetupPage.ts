import { Router } from '../router';
import { createWindow } from '../components/_components';
import { createTaskbar, createStaticDesktopBackground } from "../components/_components";
import { PongGame } from '../game/PongGame';
import { createPlayerVsAIStatsComponent } from '../components/_userComponents';

export function aiGameSetupView(router: Router) {
	const root = document.getElementById("app")!;
	root.innerHTML = "";

	const staticBackground = createStaticDesktopBackground();
	staticBackground.attachToPage(root);
	const content = document.createElement("div");

	const statsContainer = document.createElement("div");
	statsContainer.className = "mb-4";

	const playerVsAIContainer = document.createElement('div');
    playerVsAIContainer.className = "col-span-1 bg-gray-200";

	 const playerVsAIComponent = createPlayerVsAIStatsComponent({
        container: playerVsAIContainer,
        
        width: '100%',
        height: '140px',
        showTitle: true
    });

	content.appendChild( playerVsAIContainer );

	const buttonContainer = document.createElement("div");
	buttonContainer.className = 'flex flex-col items-center gap-4 p-8 rounded-lg';

	const joinClassicBtn = document.createElement("button");
	joinClassicBtn.type = "submit";
	joinClassicBtn.id = "joinBtn";
	joinClassicBtn.textContent = "Join Game against AI";
	
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
		title: "AI Game Setup",
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
		
		const playerName = localStorage.getItem('username') || "Player";
		const playerId = localStorage.getItem('userId'); 
		if(!playerId) {
			console.log('no userid found please login again');
			return;
		}
		console.log('username and id', playerName, playerId)
		try {
			const game = new PongGame(
				playerName,
				playerId,
				'ai',
				router,
			);
			await game.joinGame();
		} catch (error) {
			console.error("Failed to join game:", error);
			joinClassicBtn.disabled = false;
			joinClassicBtn.textContent = "Join Game against AI";
			joinClassicBtn.className = 'px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-bold';
		}
	});
}