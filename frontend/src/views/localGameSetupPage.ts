import { Router } from '../router';

export function localGameSetupView(router: Router) {
    const app = document.getElementById('app');
    if (!app) {
        console.error("App element not found!");
        return;
    }

    const setupContainer = document.createElement('div');
    setupContainer.className = 'flex flex-col items-center justify-center h-screen bg-gray-900 text-white';

    const form = document.createElement('form');
    form.className = 'flex flex-col items-center gap-4 p-8 bg-gray-800 rounded-lg';

    const title = document.createElement('h1');
    title.className = 'text-3xl font-bold mb-4';
    title.textContent = 'Local Game Setup';

    const label = document.createElement('label');
    label.htmlFor = 'winning-score';
    label.textContent = 'Score to Win:';
    label.className = 'text-lg';

    const input = document.createElement('input');
    input.type = 'number';
    input.id = 'winning-score';
    input.value = '5';
    input.min = '1';
    input.max = '21';
    input.className = 'w-24 text-center bg-white border border-gray-600 rounded-md p-2 text-black';

    const startButton = document.createElement('button');
    startButton.type = 'submit';
    startButton.textContent = 'Start Game';
    startButton.className = 'px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-bold';

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const score = input.value;
        router.navigate(`/localgame/play?score=${score}`);
    });

    form.append(title, label, input, startButton);
    setupContainer.appendChild(form);

    app.innerHTML = '';
    app.appendChild(setupContainer);
}