import { LocalPongGame } from '../game/LocalPongGame';
import { GAME_CONFIG } from '../types';
import { Router } from '../router';

export function localGameView(router: Router) {
    const app = document.getElementById('app');
    if (!app) {
        console.error("App element not found!");
        return { dispose: () => {} };
    }

    // Create the main container for the local game
    const gameContainer = document.createElement('div');
    gameContainer.className = 'relative flex flex-col items-center justify-center h-screen bg-gray-900 text-white';

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

    // Canvas for the game
    const canvas = document.createElement('canvas');
    canvas.id = 'local-pong-canvas';
    canvas.width = GAME_CONFIG.CANVAS.WIDTH;
    canvas.height = GAME_CONFIG.CANVAS.HEIGHT;
    canvas.style.backgroundColor = 'black';
    canvas.style.border = '2px solid white';

    // Instructions
    const instructions = document.createElement('div');
    instructions.className = 'mt-4 text-sm text-gray-400';
    instructions.innerHTML = `
        <p>Player 1: W (Up) / S (Down) | Player 2: ArrowUp / ArrowDown</p>
    `;

    gameContainer.append(backLink, title, scoreBoard, canvas, instructions);
    app.innerHTML = ''; // Clear previous content
    app.appendChild(gameContainer);

    const urlParams = new URLSearchParams(window.location.search);
    const winningScore = parseInt(urlParams.get('score') || '5', 10);

    // Initialize and start the game
    const game = new LocalPongGame(canvas, winningScore);
    game.start();

    // Return a dispose function to clean up when navigating away
    return {
        dispose: () => {
            game.dispose();
        }
    };
}