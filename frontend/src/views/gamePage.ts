export function gameView() {
    const root = document.getElementById("app")!;
    root.innerHTML = "";

    // Main container
    const container = document.createElement("div");
    container.className = "gameplay-container";

    // Header section with scores and players
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

    // Back button
    const backButton = document.createElement("button");
    backButton.className = "back-button";
    backButton.textContent = "← Back";
    backButton.onclick = () => window.history.back();
    header.appendChild(backButton);

    // Game canvas container
    const gameContainer = document.createElement("div");
    gameContainer.className = "game-container";

    const canvas = document.createElement("canvas");
    canvas.id = "gameCanvas";
    canvas.width = 900;
    canvas.height = 550;
    gameContainer.appendChild(canvas);

    // Game result overlay
    const gameOverlay = document.createElement("div");
    gameOverlay.id = "game-overlay";
    gameOverlay.className = "game-overlay hidden";
    gameOverlay.innerHTML = `
        <div class="result-content">
            <h1 id="result-title"></h1>
            <p id="result-score"></p>
        </div>
    `;
    gameContainer.appendChild(gameOverlay);

    // Append everything
    container.append(header, gameContainer);
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
            const overlay = document.getElementById("game-overlay")!;
            const title = document.getElementById("result-title")!;
            const score = document.getElementById("result-score")!;

            title.textContent = isWin ? "🎉 YOU WIN!" : "😢 YOU LOSE!";
            score.textContent = finalScore;
            overlay.classList.remove("hidden");
        },
        hideGameResult: () => {
            document.getElementById("game-overlay")!.classList.add("hidden");
        }
    };
}
