import { LocalPongGame } from '../game/LocalPongGame';
import { GAME_CONFIG } from '../types';
import { Router } from '../router';
import { GAME_MODES } from '../constants';
import { createStaticDesktopBackground } from '../components/_components';

export function localGameView(router: Router) {
    const app = document.getElementById('app');
    if (!app) {
        console.error("App element not found!");
        return { dispose: () => {} };
    }

    app.innerHTML = '';
    
    // ✅ NEW: Add background like other pages
    const staticBackground = createStaticDesktopBackground();
    staticBackground.attachToPage(app);

    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode') || GAME_MODES.CLASSIC;
    const winningScore = parseInt(urlParams.get('score') || '5', 10);

    // ✅ CHANGED: Main container with grid layout like normal game
    const gameContainer = document.createElement('div');
    gameContainer.className = 'grid grid-cols-3 gap-4 p-4 relative h-screen';

    // ✅ NEW: Left sidebar - Player 1 Info
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
    player1Controls.innerHTML = `
        <p><span class="font-bold text-white">Move:</span> W/S</p>
    `;
    
    if (mode === GAME_MODES.PELLET) {
        player1Controls.innerHTML += `
            <p><span class="font-bold text-white">Shoot:</span> D</p>
            <p><span class="font-bold text-white">Magnet:</span> A</p>
            <p id="player1-resources" class="text-yellow-400 mt-4"></p>
        `;
    } else if (mode === GAME_MODES.MULTIBALL) {
        player1Controls.innerHTML += `
            <p><span class="font-bold text-white">Speed:</span> A</p>
            <p><span class="font-bold text-white">Grow:</span> D</p>
            <p id="player1-abilities" class="text-green-400 mt-4"></p>
        `;
    }
    
    leftSidebar.append(player1Label, player1Score, player1Controls);

    // ✅ NEW: Center - Game Canvas
    const centerContent = document.createElement('div');
    centerContent.className = 'flex flex-col items-center justify-center h-full';
    
    const gameTitle = document.createElement('h1');
    gameTitle.className = 'text-3xl font-bold text-white mb-4';
    gameTitle.textContent = `Local Pong - ${getModeName(mode)}`;
    
    const gameCanvasContainer = document.createElement('div');
    gameCanvasContainer.className = 'relative';
    
    const canvas = document.createElement('canvas');
    canvas.id = 'local-pong-canvas';
    canvas.width = GAME_CONFIG.CANVAS.WIDTH;
    canvas.height = GAME_CONFIG.CANVAS.HEIGHT;
    canvas.style.backgroundColor = 'black';
    canvas.style.border = '3px solid white';
    canvas.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.3)';
    
    gameCanvasContainer.appendChild(canvas);
    centerContent.append(gameTitle, gameCanvasContainer);

    // ✅ NEW: Right sidebar - Player 2 Info
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
    player2Controls.innerHTML = `
        <p><span class="font-bold text-white">Move:</span> ↑/↓</p>
    `;
    
    if (mode === GAME_MODES.PELLET) {
        player2Controls.innerHTML += `
            <p><span class="font-bold text-white">Shoot:</span> ←</p>
            <p><span class="font-bold text-white">Magnet:</span> →</p>
            <p id="player2-resources" class="text-yellow-400 mt-4"></p>
        `;
    } else if (mode === GAME_MODES.MULTIBALL) {
        player2Controls.innerHTML += `
            <p><span class="font-bold text-white">Speed:</span> →</p>
            <p><span class="font-bold text-white">Grow:</span> ←</p>
            <p id="player2-abilities" class="text-green-400 mt-4"></p>
        `;
    }
    
    rightSidebar.append(player2Label, player2Score, player2Controls);

    // ✅ NEW: Top right corner - Back button
    const backButton = document.createElement('button');
    backButton.textContent = '← Back to Menu';
    backButton.className = 'absolute top-4 right-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm font-bold transition-colors';
    backButton.addEventListener('click', (e) => {
        e.preventDefault();
        router.navigate('/localgame');
    });

    // ✅ NEW: Mode info badge
    const modeBadge = document.createElement('div');
    modeBadge.className = 'absolute top-4 left-4 px-3 py-1 bg-blue-600 text-white rounded-md text-xs font-bold';
    modeBadge.textContent = `Winning Score: ${winningScore}`;

    gameContainer.append(leftSidebar, centerContent, rightSidebar);
    gameContainer.appendChild(backButton);
    gameContainer.appendChild(modeBadge);
    
    app.appendChild(gameContainer);

    // ✅ Initialize the game
    const game = new LocalPongGame(canvas, winningScore, mode, router, gameContainer);

    // Use a timeout to ensure DOM is ready before starting
    setTimeout(() => {
        game.start();
    }, 100);

    // Return a dispose function to clean up when navigating away
    return {
        dispose: () => {
            game.dispose();
        }
    };
}

// ✅ NEW: Helper function to get readable mode name
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