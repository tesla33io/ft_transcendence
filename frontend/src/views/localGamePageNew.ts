import { LocalPongGame } from '../game/LocalPongGame';
import { GAME_CONFIG } from '../types';
import { Router } from '../router';
import { GAME_MODES } from '../constants.ts';

export function localGameView(router: Router) {
    const app = document.getElementById('app');
    if (!app) {
        console.error("App element not found!");
        return { dispose: () => {} };
    }

    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode') || GAME_MODES.CLASSIC;
    const winningScore = parseInt(urlParams.get('score') || '5', 10);

    // Create the main container for the local game
    const gameContainer = document.createElement('div');
    gameContainer.className = 'relative flex flex-col items-center h-screen bg-gray-900 text-white py-8 overflow-y-auto';

    // Back to Desktop link
    const backLink = document.createElement('a');
    backLink.href = '/desktop';
    backLink.textContent = 'Back to Desktop';
    backLink.className = 'absolute top-4 right-4 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors';
    backLink.addEventListener('click', (e) => {
        e.preventDefault();
        router.navigate('/desktop');
    });


    // Title
    const title = document.createElement('h1');
    title.className = 'text-4xl font-bold mb-4';
    title.textContent = 'Local Pong';

    // Scoreboard
    const scoreBoard = document.createElement('div');
    scoreBoard.className = 'text-2xl mb-4';
    scoreBoard.innerHTML = `
        <span id="player1-score">0</span> - <span id="player2-score">0</span>
    `;

    // Resource Display (for Pellet Mode)
    const resourceDisplay = document.createElement('div');
    resourceDisplay.className = 'text-sm text-gray-400 mb-2 flex justify-between w-full max-w-4xl px-4';
    if (mode === GAME_MODES.PELLET) {
        resourceDisplay.innerHTML = `
            <span id="player1-resources"></span>
            <span id="player2-resources"></span>
        `;
    } else if (mode === GAME_MODES.MULTIBALL) {
        resourceDisplay.innerHTML = `
            <span id="player1-abilities"></span>
            <span id="player2-abilities"></span>
        `;
    }

    // Canvas for the game
    const canvas = document.createElement('canvas');
    canvas.id = 'local-pong-canvas';
    canvas.width = GAME_CONFIG.CANVAS.WIDTH;
    canvas.height = GAME_CONFIG.CANVAS.HEIGHT;
    canvas.style.backgroundColor = 'black';
    canvas.style.border = '2px solid white';

    // Instructions
    const instructions = document.createElement('div');
    instructions.className = 'mt-4 text-sm text-gray-400 text-center';
    instructions.innerHTML = `
        <p>P1 Move: W/S | P2 Move: ArrowUp/Down</p>
    `;
    if (mode === GAME_MODES.PELLET) {
        instructions.innerHTML += `
            <p>P1 Shoot: D | P2 Shoot: ArrowLeft</p>
            <p>P1 Magnet: A | P2 Magnet: ArrowRight</p>
        `;
    } else if (mode === GAME_MODES.MULTIBALL) {
        instructions.innerHTML += `
            <p>P1 Speed: A, Grow: D | P2 Speed: ArrowRight, Grow: ArrowLeft</p>
        `;
    }

    const gameCanvasContainer = document.createElement('div');
    gameCanvasContainer.className = 'relative'; // For positioning the overlay
    gameCanvasContainer.append(canvas, instructions);

    gameContainer.append(backLink, title, scoreBoard, resourceDisplay, gameCanvasContainer);
    app.innerHTML = ''; // Clear previous content
    app.appendChild(gameContainer);

    // Initialize the game
    const game = new LocalPongGame(canvas, winningScore, mode, router, gameCanvasContainer);

    // Use a timeout to scroll the canvas into view after the page has rendered.
    setTimeout(() => {
        canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
        game.start(); // Start the game (and its countdown) after scrolling
    }, 100);

    // Return a dispose function to clean up when navigating away
    return {
        dispose: () => {
            game.dispose();
        }
    };
}