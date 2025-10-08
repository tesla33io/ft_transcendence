import { Router } from "../router";
import { createWindow } from "./components";

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

	passwordField.appendChild(passwordLabel);
	passwordField.appendChild(passwordInput);

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
	loginBtn.addEventListener("click", () => {

		verifyLogin(usernameInput.value,passwordInput.value, router);
	});

	registerBtn.addEventListener("click", () => router.navigate("/register"));
	guestBtn.addEventListener("click", () => router.navigate("/guest"));

	// --- Attach to root ---
	root.appendChild(loginWindow);
}

function verifyLogin(username: string, password: string, router: Router){
	console.log('user:',username,' with password:',password,' logged in');
	//hash the password
	//send api verfy call to backend 
	//if(call returns succes)
		//connect to websocket
		router.navigate("/desktop");
	//else some message etc 
	//limit trys maybe in the bakend logic ? 
}