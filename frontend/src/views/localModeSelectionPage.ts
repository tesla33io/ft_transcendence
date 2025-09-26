import { Router } from '../router';
import { GAME_MODES } from '../constants';

export function localModeSelectionView(router: Router) {
    const app = document.getElementById('app');
    if (!app) {
        console.error("App element not found!");
        return;
    }

    const selectionContainer = document.createElement('div');
    selectionContainer.className = 'flex flex-col items-center justify-center h-screen bg-gray-900 text-white';

    const title = document.createElement('h1');
    title.className = 'text-4xl font-bold mb-8';
    title.textContent = 'Select a Game Mode';

    const modesContainer = document.createElement('div');
    modesContainer.className = 'flex flex-col gap-4';

    // Classic Pong Button
    const classicButton = document.createElement('button');
    classicButton.textContent = 'Classic Pong';
    classicButton.className = 'px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-md font-bold text-xl';
    classicButton.addEventListener('click', () => {
        // Unify flow: always pass the mode to the setup page
        router.navigate(`/localgame/setup?mode=${GAME_MODES.CLASSIC}`);
    });

    // Example of a future mode
    const futureModeButton = document.createElement('button');
    futureModeButton.textContent = 'Speed Mode';
    futureModeButton.className = 'px-8 py-4 bg-green-600 hover:bg-green-700 rounded-md font-bold text-xl';
    futureModeButton.addEventListener('click', () => {
        // Navigate to the setup page for speed mode
        router.navigate(`/localgame/setup?mode=${GAME_MODES.SPEED}`);
    });

    // Pellet Mode Button
    const pelletModeButton = document.createElement('button');
    pelletModeButton.textContent = 'Pellet Mode';
    pelletModeButton.className = 'px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-md font-bold text-xl';
    pelletModeButton.addEventListener('click', () => {
        // Navigate to the setup page for pellet mode
        router.navigate(`/localgame/setup?mode=${GAME_MODES.PELLET}`);
    });

    modesContainer.append(classicButton, futureModeButton, pelletModeButton);
    selectionContainer.append(title, modesContainer);

    app.innerHTML = '';
    app.appendChild(selectionContainer);

    return {
        dispose: () => {}
    };
}