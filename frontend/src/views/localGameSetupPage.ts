import { Router } from '../router';
import { createWindow } from './components';

export function localGameSetupView(router: Router) {
	const app = document.getElementById('app');
	if (!app) {
		console.error("App element not found!");
		return;
	}

	// --- Setup Form Content ---
	const content = document.createElement('div');
	content.className = 'flex flex-col items-center justify-center';

	const form = document.createElement('form');
	form.className = 'flex flex-col items-center gap-4 p-8 rounded-lg';

	const title = document.createElement('header');
	title.className = 'text-[14px]  ';
	title.textContent = 'Set up your 1 vs 1';

	const label = document.createElement('label');
	label.htmlFor = 'winning-score';
	label.textContent = 'Score to Win:';
	label.className = 'text-lg';

	// Use a select styled with 98.css
	const select = document.createElement('select');
	select.id = 'winning-score';
	select.className = 'select'; // 98.css style

	const options = [
	  { value: '10', text: '10 - Extra long Game' },
	  { value: '5', text: '5 - Full game' },
	  { value: '3', text: '3 - Quick Round' },
	  { value: '1', text: '1 - ultra short Round' },
	];

	options.forEach(opt => {
	  const option = document.createElement('option');
	  option.value = opt.value;
	  option.textContent = opt.text;
	  select.appendChild(option);
	});

	const startButton = document.createElement('button');
	startButton.type = 'submit';
	startButton.textContent = 'Start Game';
	startButton.className = 'px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-bold';

	form.addEventListener('submit', (e) => {
	  e.preventDefault();
	  const score = select.value;
	  router.navigate(`/localgame/play?score=${score}`);
	});

	form.append(title, label, select, startButton);
	content.appendChild(form);

	// --- Use createWindow ---
	const setupWindow = createWindow({
		title: "Local Game Setup",
		width: "400px",
		content: content,
		titleBarControls: {
			help: true,
			close: true,
			onClose: () => {
				window.history.back();
			}
		}
	});
	
	app.innerHTML = '';
	app.appendChild(setupWindow);
	}