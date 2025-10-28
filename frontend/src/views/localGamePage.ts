import { LocalPongGame } from '../game/LocalPongGame';
import { GAME_CONFIG } from '../types';
import { Router } from '../router';
import { GAME_MODES } from '../constants';
import { 
    createStaticDesktopBackground,
    createGameHeader,
    createWindow,
    createTaskbar
} from '../components';

export function localGameView(router: Router) {
    const app = document.getElementById('app');
    if (!app) {
        console.error("App element not found!");
        return { dispose: () => {} };
    }

    app.innerHTML = '';
    
    const staticBackground = createStaticDesktopBackground();
    staticBackground.attachToPage(app);

    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode') || GAME_MODES.CLASSIC;
    const winningScore = parseInt(urlParams.get('score') || '5', 10);

    const content = document.createElement("div");

    const header = createGameHeader({
        player1Name: 'Player 1',
        player2Name: 'Player 2',
        player1Score: 0,
        player2Score: 0,
        showVS: true
    });

    content.appendChild(header);

    // ✅ CHANGED: Create game container with proper layout
    const gameContainer = document.createElement("div");
    gameContainer.className = "game-container";
    gameContainer.style.display = "flex";
    gameContainer.style.flexDirection = "column";
    gameContainer.style.alignItems = "center";

    const canvas = document.createElement("canvas");
    canvas.id = "local-pong-canvas";
    canvas.width = GAME_CONFIG.CANVAS.WIDTH;
    canvas.height = GAME_CONFIG.CANVAS.HEIGHT;
    gameContainer.appendChild(canvas);

    // ✅ CHANGED: Add description text with better styling
    const description = document.createElement("p");
    description.style.fontSize = "16px";
    description.style.color = "";
    description.style.textAlign = "center";
    description.style.marginTop = "12px";
    description.style.marginBottom = "0";
    description.style.marginLeft = "0";
    description.style.marginRight = "0";
    description.textContent = getModeControlsText(mode);
    gameContainer.appendChild(description);

    content.appendChild(gameContainer);

    const modeName = getModeName(mode);

    // ✅ CHANGED: Increased window height from 620px to 680px
    const gameWindow = createWindow({
        title: `Local Pong - ${modeName}`,
        width: "920px",
        height: "650px",
        content: content,
        titleBarControls: {
            close: true,
            onClose: () => {
                router.navigate("/localgame");
            }
        }
    });

    app.appendChild(gameWindow);

    const { taskbar } = createTaskbar({
        startButton: {
            label: "Start",
            onClick: () => router.navigate("/"),
        },
        clock: true,
    });
    app.appendChild(taskbar);

    const game = new LocalPongGame(canvas, winningScore, mode, router, gameWindow);

    setTimeout(() => {
        game.start();
    }, 100);

    return {
        canvas,
        updateScore: (playerScore: number, opponentScore: number) => {
            const playerScoreEl = document.getElementById("player-score");
            const opponentScoreEl = document.getElementById("opponent-score");
            if (playerScoreEl) playerScoreEl.textContent = playerScore.toString();
            if (opponentScoreEl) opponentScoreEl.textContent = opponentScore.toString();
        },
        dispose: () => {
            game.dispose();
        }
    };
}

function getModeName(mode: string): string {
    const modeNames: { [key: string]: string } = {
        'classic': 'Classic',
        'speed': 'Speed Mode',
        'pellet': 'Pellet Mode',
        'multiball': 'Multi-Ball Mode',
        'twod': '2D Mode'
    };
    return modeNames[mode] || 'Classic';
}

// ✅ NEW: Helper function to get mode-specific control text
function getModeControlsText(mode: string): string {
    const controls: { [key: string]: string } = {
        'classic': 'P1: W/S to move | P2: ↑/↓ to move',
        'speed': 'P1: W/S to move | P2: ↑/↓ to move',
        'pellet': 'P1: W/S move, D shoot, A magnet | P2: ↑/↓ move, ← shoot, → magnet',
        'multiball': 'P1: W/S move, A speedup, D grow | P2: ↑/↓ move, → speedup, ← grow',
        'twod': 'P1: W/A/S/D to move freely | P2: ↑/←/↓/→ to move freely'
    };
    return controls[mode] || controls['classic'];
}