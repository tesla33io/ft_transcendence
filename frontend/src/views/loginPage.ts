import { Router } from "../router";
import { createWindow } from "./_components";
import { UserService } from "../game/userService";
import type { LoginRequest } from "../types";


export function loginView(router: Router) {
	const root = document.getElementById("app")!;
	root.innerHTML = "";

	// --- Content container ---
	const content = document.createElement("div");

	// --- Username field ---
	const usernameField = document.createElement("div");
	usernameField.className = "field-row-stacked";
	usernameField.style.width = "200px";

	const usernameLabel = document.createElement("label");
	usernameLabel.htmlFor = "text18";
	usernameLabel.textContent = "Username";

	const usernameInput = document.createElement("input");
	usernameInput.id = "text18";
	usernameInput.type = "text";
	usernameInput.className = "mb-4"; // margin-bottom: 16px

	usernameField.appendChild(usernameLabel);
	usernameField.appendChild(usernameInput);

	// --- Password field ---
	const passwordField = document.createElement("div");
	passwordField.className = "field-row-stacked";
	passwordField.style.width = "200px";

	const passwordLabel = document.createElement("label");
	passwordLabel.htmlFor = "text19";
	passwordLabel.textContent = "Password";

	const passwordInput = document.createElement("input");
	passwordInput.id = "text19";
	passwordInput.type = "password";
	passwordInput.className = "mb-4";  // margin-bottom: 16px

	passwordField.appendChild(passwordLabel);
	passwordField.appendChild(passwordInput);

	// --- Error message area ---
	const errorMessage = document.createElement("div");
	errorMessage.style.color = "red";
	errorMessage.style.textAlign = "center";
	errorMessage.style.marginTop = "10px";
	errorMessage.style.display = "none";

	// --- Loading message ---
	const loadingMessage = document.createElement("div");
	loadingMessage.textContent = "Logging in...";
	loadingMessage.style.textAlign = "center";
	loadingMessage.style.marginTop = "10px";
	loadingMessage.style.display = "none";

	// --- Buttons row ---
	const buttonRow = document.createElement("div");
	buttonRow.className = "field-row";

	const loginBtn = document.createElement("button");
	loginBtn.id = "loginBtn";
	loginBtn.textContent = "Login";
	

	const registerBtn = document.createElement("button");
	registerBtn.id = "registerBtn";
	registerBtn.textContent = "Register";

	const guestBtn = document.createElement("button");
	guestBtn.id = "guestBtn";
	guestBtn.textContent = "Play as guest";

	buttonRow.appendChild(loginBtn);
	buttonRow.appendChild(registerBtn);
	buttonRow.appendChild(guestBtn);

	// --- Assemble content ---
	content.appendChild(usernameField);
	content.appendChild(passwordField);
	content.appendChild(errorMessage);
	content.appendChild(loadingMessage);
	content.appendChild(buttonRow);

	// --- Create window with content ---
	const loginWindow = createWindow({
		title: "Transcendence Os",
		width: "400px",
		content: content,
		titleBarControls: {
			help: true
		}
	});

	// --- Event listeners ---
	loginBtn.addEventListener("click", async () => {
		const username = usernameInput.value.trim();
		const password = passwordInput.value.trim();
		
		// Basic validation
		if (!username || !password) {
			showError("Please enter both username and password");
			return;
		}

		await handleLogin(username, password, router);
	});

	// Allow Enter key to submit
	const handleEnterKey = (e: KeyboardEvent) => {
		if (e.key === 'Enter') {
			loginBtn.click();
		}
	};
	usernameInput.addEventListener('keypress', handleEnterKey);
	passwordInput.addEventListener('keypress', handleEnterKey);

	registerBtn.addEventListener("click", () => router.navigate("/register"));
	guestBtn.addEventListener("click", () => router.navigate("/guest"));

	// --- Helper functions ---
	function showError(message: string) {
		errorMessage.textContent = message;
		errorMessage.style.display = "block";
		loadingMessage.style.display = "none";
	}

	function showLoading() {
		loadingMessage.style.display = "block";
		errorMessage.style.display = "none";
		loginBtn.disabled = true;
		loginBtn.textContent = "Logging in...";
	}

	function hideLoading() {
		loadingMessage.style.display = "none";
		loginBtn.disabled = false;
		loginBtn.textContent = "Login";
	}

	async function handleLogin(username: string, password: string, router: Router) {
		showLoading();

		try {
			// Create LoginRequest object
			const credentials: LoginRequest = {
				username: username,
				password: password
				// add later twoFactorCode 
			};

			console.log('login request:', credentials);

			// Call UserService login method
			const authResponse = await UserService.login(credentials);

			console.log('Login successful!', {
				user: authResponse.user,
				token: authResponse.token ? 'Token received' : 'No token',
				expiresAt: authResponse.expiresAt
			});
			router.navigate("/desktop");

		} catch (error) {
			console.error('Login failed:', error);
			hideLoading();
			showError(error instanceof Error ? error.message : 'Login failed. Please try again.');
		}
	}

	// --- Attach to root ---
	root.appendChild(loginWindow);

	// Focus on username input for better UX
	setTimeout(() => usernameInput.focus(), 100);
}