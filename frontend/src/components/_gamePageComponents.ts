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

export interface LocalGameLayoutConfig {
    header: HTMLElement;
    canvas: HTMLCanvasElement;
    mode: string;
    winningScore: number;
    onBackClick: () => void;
}

export function createLocalGameLayout(config: LocalGameLayoutConfig): {
    container: HTMLElement;
    canvas: HTMLCanvasElement;
} {
    const gameContainer = document.createElement('div');
    gameContainer.className = 'grid grid-cols-3 gap-4 p-4 relative h-screen';

    // ✅ Left sidebar - Player 1 Info
    const leftSidebar = document.createElement('div');
    leftSidebar.className = 'flex flex-col items-center justify-start text-white pt-8';
    
    const player1Label = document.createElement('h2');
    player1Label.className = 'text-2xl font-bold mb-4';
    player1Label.textContent = 'Player 1';
    
    const player1Score = document.createElement('div');
    player1Score.className = 'text-6xl font-bold mb-4';
    player1Score.id = 'player1-score';
    player1Score.textContent = '0';
    
    const player1Controls = document.createElement('div');
    player1Controls.className = 'text-sm text-gray-400 text-center mt-8 space-y-2';
    player1Controls.innerHTML = `<p><span class="font-bold text-white">Move:</span> W/S</p>`;
    
    if (config.mode === 'pellet') {
        player1Controls.innerHTML += `
            <p><span class="font-bold text-white">Shoot:</span> D</p>
            <p><span class="font-bold text-white">Magnet:</span> A</p>
            <p id="player1-resources" class="text-yellow-400 mt-4"></p>
        `;
    } else if (config.mode === 'multiball') {
        player1Controls.innerHTML += `
            <p><span class="font-bold text-white">Speed:</span> A</p>
            <p><span class="font-bold text-white">Grow:</span> D</p>
            <p id="player1-abilities" class="text-green-400 mt-4"></p>
        `;
    }
    
    leftSidebar.append(player1Label, player1Score, player1Controls);

    // ✅ Center - Game Canvas
    const centerContent = document.createElement('div');
    centerContent.className = 'flex flex-col items-center justify-center h-full';
    
    const gameCanvasContainer = document.createElement('div');
    gameCanvasContainer.className = 'relative';
    gameCanvasContainer.appendChild(config.header);
    gameCanvasContainer.appendChild(config.canvas);
    
    centerContent.appendChild(gameCanvasContainer);

    // ✅ Right sidebar - Player 2 Info
    const rightSidebar = document.createElement('div');
    rightSidebar.className = 'flex flex-col items-center justify-start text-white pt-8';
    
    const player2Label = document.createElement('h2');
    player2Label.className = 'text-2xl font-bold mb-4';
    player2Label.textContent = 'Player 2';
    
    const player2Score = document.createElement('div');
    player2Score.className = 'text-6xl font-bold mb-4';
    player2Score.id = 'player2-score';
    player2Score.textContent = '0';
    
    const player2Controls = document.createElement('div');
    player2Controls.className = 'text-sm text-gray-400 text-center mt-8 space-y-2';
    player2Controls.innerHTML = `<p><span class="font-bold text-white">Move:</span> ↑/↓</p>`;
    
    if (config.mode === 'pellet') {
        player2Controls.innerHTML += `
            <p><span class="font-bold text-white">Shoot:</span> ←</p>
            <p><span class="font-bold text-white">Magnet:</span> →</p>
            <p id="player2-resources" class="text-yellow-400 mt-4"></p>
        `;
    } else if (config.mode === 'multiball') {
        player2Controls.innerHTML += `
            <p><span class="font-bold text-white">Speed:</span> →</p>
            <p><span class="font-bold text-white">Grow:</span> ←</p>
            <p id="player2-abilities" class="text-green-400 mt-4"></p>
        `;
    }
    
    rightSidebar.append(player2Label, player2Score, player2Controls);

    // ✅ Top right corner - Back button
    const backButton = document.createElement('button');
    backButton.textContent = '← Back to Menu';
    backButton.className = 'absolute top-4 right-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm font-bold transition-colors z-10';
    backButton.addEventListener('click', config.onBackClick);

    // ✅ Mode info badge
    const modeBadge = document.createElement('div');
    modeBadge.className = 'absolute top-4 left-4 px-3 py-1 bg-blue-600 text-white rounded-md text-xs font-bold z-10';
    modeBadge.textContent = `Winning Score: ${config.winningScore}`;

    gameContainer.append(leftSidebar, centerContent, rightSidebar, backButton, modeBadge);

    return { container: gameContainer, canvas: config.canvas };
}

// ✅ Helper function to get readable mode name
export function getModeName(mode: string): string {
    const modeNames: { [key: string]: string } = {
        'classic': 'Classic',
        'speed': 'Speed Mode',
        'pellet': 'Pellet Mode',
        'multiball': 'Multi-Ball Mode',
        'twod': '2D Mode'
    };
    return modeNames[mode] || 'Classic';
}

