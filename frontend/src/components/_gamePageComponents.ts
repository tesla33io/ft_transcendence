


export interface ScoreboardConfig {
    player1Name: string;
    player2Name: string;
    player1Score: number;
    player2Score: number;
    showVS?: boolean;
}

export function createGameHeader(config: ScoreboardConfig): HTMLElement {
    const header = document.createElement("div");
    header.className = "game-header";

    const scoreBoard = document.createElement("div");
    scoreBoard.className = "score-board";

    // Player 1 Info
    const player1Info = document.createElement("div");
    player1Info.className = "player-info";

    const player1Name = document.createElement("span");
    player1Name.id = "player-name";
    player1Name.textContent = config.player1Name;

    const player1Score = document.createElement("span");
    player1Score.id = "player-score";
    player1Score.textContent = config.player1Score.toString();

    player1Info.appendChild(player1Name);
    player1Info.appendChild(player1Score);

    // VS Text
    const vsText = document.createElement("div");
    vsText.className = "vs";
    vsText.textContent = "VS";

    // Player 2 Info
    const player2Info = document.createElement("div");
    player2Info.className = "player-info";

    const player2Name = document.createElement("span");
    player2Name.id = "opponent-name";
    player2Name.textContent = config.player2Name;

    const player2Score = document.createElement("span");
    player2Score.id = "opponent-score";
    player2Score.textContent = config.player2Score.toString();

    player2Info.appendChild(player2Name);
    player2Info.appendChild(player2Score);

    scoreBoard.appendChild(player1Info);
    if (config.showVS !== false) scoreBoard.appendChild(vsText);
    scoreBoard.appendChild(player2Info);

    header.appendChild(scoreBoard);
    return header;
}

export function updateGameHeader(player1Score: number, player2Score: number) {
    const p1ScoreEl = document.getElementById("player-score");
    const p2ScoreEl = document.getElementById("opponent-score");
    
    if (p1ScoreEl) p1ScoreEl.textContent = player1Score.toString();
    if (p2ScoreEl) p2ScoreEl.textContent = player2Score.toString();
}

export function updatePlayerNames(player1Name: string, player2Name: string) {
    const p1NameEl = document.getElementById("player-name");
    const p2NameEl = document.getElementById("opponent-name");
    
    if (p1NameEl) p1NameEl.textContent = player1Name;
    if (p2NameEl) p2NameEl.textContent = player2Name;
}

export interface CanvasConfig {
    width?: number;
    height?: number;
    title?: string;
}

export function createGameCanvasContainer(config: CanvasConfig = {}): {
    container: HTMLElement;
    canvas: HTMLCanvasElement;
} {
    const container = document.createElement("div");
    container.className = "game-container";

    if (config.title) {
        const title = document.createElement("h2");
        title.className = "text-xl font-bold text-white mb-2";
        title.textContent = config.title;
        container.appendChild(title);
    }

    const canvas = document.createElement("canvas");
    canvas.id = "gameCanvas";
    canvas.width = config.width || 900;
    canvas.height = config.height || 550;
    canvas.style.display = "block";
    canvas.style.margin = "0 auto";

    container.appendChild(canvas);

    return { container, canvas };
}

