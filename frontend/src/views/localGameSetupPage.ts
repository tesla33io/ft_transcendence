import { Router } from '../router';
import { GAME_MODES } from '../types';
import { 
    createWindow,
    createTaskbar,
    createStaticDesktopBackground
} from '../components';

export function localGameSetupView(router: Router) {
    const app = document.getElementById('app');
    if (!app) {
        console.error("App element not found!");
        return;
    }

    app.innerHTML = '';

    const staticBackground = createStaticDesktopBackground();
    staticBackground.attachToPage(app);

    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode') || GAME_MODES.CLASSIC;

    const content = document.createElement('div');
    content.className = 'p-4 flex flex-col gap-4';

    const title = document.createElement('h2');
    title.className = 'text-lg font-bold text-center mb-2';
    title.textContent = 'Game Setup';

    // Score selection with Windows 98 select
    const scoreField = document.createElement('div');
    scoreField.className = 'field-row-stacked';

    const scoreLabel = document.createElement('label');
    scoreLabel.htmlFor = 'winning-score';
    scoreLabel.textContent = 'Winning Score:';
    scoreLabel.className = 'text-sm font-semibold';

    const select = document.createElement('select');
    select.id = 'winning-score';
    select.className = 'w-full px-2 py-1 bg-white border-2 border-gray-400 font-retro';
 
    select.innerHTML = `
        <option value="5">10 - Long Game</option>
        <option value="4">5 - Normal Game </option>
        <option value="3" selected>3 - Quick Game</option>
        <option value="1">1 - Ultra short Game</option>
    `;

    scoreField.append(scoreLabel, select);

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'flex gap-2 justify-center mt-4';

    const startButton = document.createElement('button');
    startButton.type = 'button';
    startButton.textContent = 'Start Game';
    startButton.className = 'button px-6 py-1 font-retro';
    startButton.addEventListener('click', () => {
        const score = select.value;
        router.navigate(`/localgame/play?mode=${mode}&score=${score}`);
    });

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.textContent = 'Back';
    cancelButton.className = 'button px-6 py-1 font-retro';
    cancelButton.addEventListener('click', () => {
        router.navigate('/localgame');
    });

    buttonContainer.append(startButton, cancelButton);

    const helpText = document.createElement('div');
    helpText.className = 'text-xs text-gray-600 text-center mt-2 italic';
    helpText.textContent = 'First player to reach the winning score wins the game!';

    content.append(title, scoreField, buttonContainer, helpText);

    const setupWindow = createWindow({
        title: `Setup - ${getModeName(mode)}`,
        width: '350px',
        height: '280px',
        content: content,
        titleBarControls: {
            close: true,
            onClose: () => {
                router.navigate('/Desktop');
            }
        }
    });

    app.appendChild(setupWindow);

    const { taskbar } = createTaskbar({
        startButton: {
            label: "Start",
            onClick: () => router.navigate("/"),
        },
        clock: true,
    });
    app.appendChild(taskbar);
}

function getModeName(mode: string): string {
    const modeNames: { [key: string]: string } = {
        'classic': 'Classic',
        'speed': 'Speed Mode',
        'pellet': 'Pellet Mode',
        'multiball': 'Multi-Ball Mode',
        '2d': '2D Mode'
    };
    return modeNames[mode] || 'Classic';
}