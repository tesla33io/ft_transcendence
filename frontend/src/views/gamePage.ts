import { Router } from "../router";
import { createWindow } from "./components";

export function gameView(router: Router) {
    const root = document.getElementById("app")!;
    root.innerHTML = "";

    // Create the main content for the window
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
				router.navigate("/desktop");
                // put back for local game later window.history.back();
            }
        }
    });

    root.appendChild(gameWindow);

    // Result window (separate window)
    let resultWindow: HTMLElement | null = null;

    const showGameResult = (isWin: boolean, finalScore: string) => {
        // Create result content
        const resultContent = document.createElement("div");
        resultContent.className = "window-body";

        const resultScore = document.createElement("p");
        resultScore.textContent = finalScore;

        const backToMenuBtn = document.createElement("button");
        backToMenuBtn.textContent = "Menu";
        backToMenuBtn.className = "button";
        backToMenuBtn.addEventListener("click", () => {
            router.navigate("/desktop");
        });

        resultContent.appendChild(resultScore);
        resultContent.appendChild(backToMenuBtn);

        // Create result window
        resultWindow = createWindow({
            title: isWin ? "YOU WIN!" : "YOU LOSE!",
            width: "300px",
            height: "200px",
            content: resultContent,
            initialPosition: { x: 200, y: 150 },
            titleBarControls: {
                close: true,
                onClose: () => {
                    if (resultWindow) {
                        resultWindow.remove();
                        resultWindow = null;
                    }
                }
            }
        });

        // Add high z-index with Tailwind
        resultWindow.className += " z-50";
        root.appendChild(resultWindow);
    };

    const hideGameResult = () => {
        if (resultWindow) {
            resultWindow.remove();
            resultWindow = null;
        }
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
