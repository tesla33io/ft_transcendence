import { Router } from '../router';
import { GAME_MODES } from '../types';
import { 
    createWindow,
    createTaskbar,
    createStaticDesktopBackground
} from '../components';

export function localModeSelectionView(router: Router) {
    const app = document.getElementById('app');
    if (!app) {
        console.error("App element not found!");
        return;
    }

    app.innerHTML = '';

    // ✅ NEW: Add background like other pages
    const staticBackground = createStaticDesktopBackground();
    staticBackground.attachToPage(app);

    // ✅ CHANGED: Create window content
    const content = document.createElement('div');
    content.className = 'p-6 flex flex-col gap-4';

    // ✅ NEW: Title
    const title = document.createElement('h2');
    title.className = 'text-lg font-bold text-center mb-4';
    title.textContent = 'Select a Game Mode';

    // ✅ CHANGED: Modes container for Windows 98 style
    const modesContainer = document.createElement('div');
    modesContainer.className = 'flex flex-col gap-3';

    // ✅ CHANGED: Game mode buttons with Windows 98 styling
    const gameModes = [
        { 
            name: 'Classic Pong', 
            mode: GAME_MODES.CLASSIC,
            description: 'Traditional pong gameplay'
        },
        { 
            name: 'Speed Mode', 
            mode: GAME_MODES.SPEED,
            description: 'Ball accelerates with each paddle hit'
        },
        { 
            name: 'Pellet Mode', 
            mode: GAME_MODES.PELLET,
            description: 'Shoot pellets at your opponent'
        },
        { 
            name: 'Multi-Ball Mode', 
            mode: GAME_MODES.MULTIBALL,
            description: 'Multiple balls in play'
        },
        { 
            name: '2D Mode', 
            mode: GAME_MODES.TWOD,
            description: 'Move paddles in 2D space'
        }
    ];

    gameModes.forEach(gameMode => {
        const buttonContainer = document.createElement('div');
        // ✅ CHANGED: Use rgb(224, 224, 224) background color
        buttonContainer.className = `
            border-2 p-3 cursor-pointer transition-all
            border-t-2 border-l-2 border-t-white border-l-white
            border-b-2 border-r-2 border-b-gray-400 border-r-gray-400
            hover:brightness-110
            active:border-t-gray-400 active:border-l-gray-400
            active:border-b-white active:border-r-white
        `;
        // ✅ CHANGED: Set background color via style
        buttonContainer.style.backgroundColor = 'rgb(224, 224, 224)';
        buttonContainer.style.minHeight = '50px';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.flexDirection = 'column';
        buttonContainer.style.justifyContent = 'center';
        
        const buttonLabel = document.createElement('div');
        buttonLabel.className = 'font-semibold text-sm text-gray-800';
        buttonLabel.textContent = gameMode.name;
        
        const buttonDesc = document.createElement('div');
        buttonDesc.className = 'text-xs text-gray-600 mt-1';
        buttonDesc.textContent = gameMode.description;
        
        buttonContainer.append(buttonLabel, buttonDesc);
        
        buttonContainer.addEventListener('click', () => {
            router.navigate(`/localgame/setup?mode=${gameMode.mode}`);
        });

        modesContainer.appendChild(buttonContainer);
    });

  
   

    content.append(title, modesContainer);

    // ✅ CHANGED: Bigger window
    const selectionWindow = createWindow({
        title: 'Local Pong - Mode Selection',
        width: '500px',  // ✅ CHANGED: Increased from 400px
        height: '570px',  // ✅ CHANGED: Increased from 380px
        content: content,
        titleBarControls: {
            close: true,
            onClose: () => {
                router.navigate('/Desktop');
            }
        }
    });

    app.appendChild(selectionWindow);

    const { taskbar } = createTaskbar({
		clock: true,
		router: router
	});
    app.appendChild(taskbar);

    return {
        dispose: () => {}
    };
}