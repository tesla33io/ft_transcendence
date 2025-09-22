import { Router } from "../router";


export function gameView(router: Router) {
    const root = document.getElementById("app")!;
    root.innerHTML = "";

    // Main window container
    const container = document.createElement("div");
    container.className = "game-window";
    container.style.position = "absolute";  // required for dragging
    container.style.top = "50px";
    container.style.left = "50px";

    // Title bar
    const titlebar = document.createElement("div");
    titlebar.className = "title-bar";
    titlebar.innerHTML = `
        <div class="title-bar-text">Pong Game</div>
        <div class="title-bar-controls">
            <button aria-label="Close">×</button>
        </div>
    `;
    container.appendChild(titlebar);

    // Close button functionality
    const closeBtn = titlebar.querySelector("button")!;
    closeBtn.addEventListener("click", () => {
       window.history.back(); //go back to per window
    });

    // Header with scores
    const header = document.createElement("div");
    header.className = "game-header";

    const scoreBoard = document.createElement("div");
    scoreBoard.className = "score-board";
    scoreBoard.innerHTML = `
        <div class="player-info">
            <span id="opponent-name">Opponent</span>
            <span id="opponent-score">0</span>
        </div>
        <div class="vs">VS</div>
        <div class="player-info">
            <span id="player-name">Player</span>
            <span id="player-score">0</span>
        </div>
    `;
    header.appendChild(scoreBoard);

    container.appendChild(header);
    // Game canvas container
    const gameContainer = document.createElement("div");
    gameContainer.className = "game-container";

    const canvas = document.createElement("canvas");
    canvas.id = "gameCanvas";
    canvas.width = 900;
    canvas.height = 550;
    gameContainer.appendChild(canvas);

	container.appendChild(gameContainer);


	// Result window
	const resultWindow = document.createElement("div");
	resultWindow.className = "window result-window hidden";
	resultWindow.style.position = "absolute";
	resultWindow.style.top = "50%";
	resultWindow.style.left = "50%";
	resultWindow.style.transform = "translate(-50%, -50%)";

	// Create title bar for result window
	const resultTitleBar = document.createElement("div");
	resultTitleBar.className = "title-bar";

	// Create title text
	const resultTitleText = document.createElement("div");
	resultTitleText.className = "title-bar-text";
	resultTitleText.id = "result-title";

	// Create controls container
	const resultControls = document.createElement("div");
	resultControls.className = "title-bar-controls";

	// Create close button
	const closeResultBtn = document.createElement("button");
	closeResultBtn.setAttribute("aria-label", "Close");

	// Create window body
	const resultBody = document.createElement("div");
	resultBody.className = "window-body";

	const resultScore = document.createElement("p");
	resultScore.id = "result-score";

	// back to menu button
	const backToMenuBtn = document.createElement("button");
	backToMenuBtn.textContent = "Menu";
	backToMenuBtn.className = "button";

	backToMenuBtn.addEventListener("click", () => {
		router.navigate("/")
	});

	// Assemble the components
	resultControls.appendChild(closeResultBtn);
	resultTitleBar.append(resultTitleText, resultControls);
	resultBody.append(resultScore,backToMenuBtn);
	resultWindow.append(resultTitleBar, resultBody);

	// Add to container
	container.appendChild(resultWindow);

	//gamewin dragable
	let isDragging = false;
	let offsetX = 0;
	let offsetY = 0;

	titlebar.addEventListener("mousedown", (e) => {
		isDragging = true;
		offsetX = e.clientX - container.offsetLeft;
		offsetY = e.clientY - container.offsetTop;
	});

	document.addEventListener("mousemove", (e) => {
		if (isDragging) {
			container.style.left = `${e.clientX - offsetX}px`;
			container.style.top = `${e.clientY - offsetY}px`;
			container.style.transform = "none"; // remove any transform
		}
	});

	document.addEventListener("mouseup", () => {
		isDragging = false;
	});



	// result window draggable
	let isResultDragging = false;
	let resultOffsetX = 0;
	let resultOffsetY = 0;



	resultTitleBar.addEventListener("mousedown", (e) => {
		isResultDragging = true;
		resultOffsetX = e.clientX - resultWindow.offsetLeft;
		resultOffsetY = e.clientY - resultWindow.offsetTop;
	});

	document.addEventListener("mousemove", (e) => {
		if (isResultDragging) {
			resultWindow.style.left = `${e.clientX - resultOffsetX}px`;
			resultWindow.style.top = `${e.clientY - resultOffsetY}px`;
			resultWindow.style.transform = "none"; // Remove center positioning
		}
	});

	document.addEventListener("mouseup", () => {
		isResultDragging = false;
	});

	// Close button functionality
	closeResultBtn.addEventListener("click", () => {
		resultWindow.classList.add("hidden");
	});



	root.appendChild(container);
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
         showGameResult: (isWin: boolean, finalScore: string) => {
        resultTitleText.textContent = isWin ? "YOU WIN!" : "YOU LOSE!";
        resultScore.textContent = finalScore;
        resultWindow.classList.remove("hidden");
		},
    	hideGameResult: () => {
        	resultWindow.classList.add("hidden");
    	}
    };
}
