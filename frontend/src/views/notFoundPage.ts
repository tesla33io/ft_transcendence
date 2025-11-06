import { Router } from '../router';
import { createTaskbar } from '../components/_components';

export function notFoundView(router: Router) {
	const root = document.getElementById("app")!;
	root.innerHTML = "";

	// Create main content container
	const content = document.createElement("div");
	content.className = "flex flex-col items-center justify-center h-screen ";
	content.style.paddingBottom = "60px"; // Leave space for taskbar

	// Error content
	const errorContainer = document.createElement("div");
	errorContainer.className = "text-center";

	// 404 Title
	const title = document.createElement("h1");
	title.textContent = "404";
	title.className = "text-6xl font-bold mb-4 text-red-600";

	// Error message
	const message = document.createElement("h2");
	message.textContent = "Page Not Found";
	message.className = "text-2xl mb-4 text-gray-700";

	// Description
	const description = document.createElement("p");
	description.textContent = "The page you're looking for doesn't exist.";
	description.className = "text-gray-700 mb-6";

	

	// Assemble error content
	errorContainer.appendChild(title);
	errorContainer.appendChild(message);
	errorContainer.appendChild(description);
	content.appendChild(errorContainer);

	// Add content to root
	root.appendChild(content);

	// Create and add taskbar
	const { taskbar } = createTaskbar({
		clock: true,
		router: router
	});

	root.appendChild(taskbar);
}