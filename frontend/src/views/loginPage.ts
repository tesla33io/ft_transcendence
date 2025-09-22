import { Router } from "../router";
import { createWindow } from "./components";

export function loginView(router:Router) {
    const root = document.getElementById("app")!;
    root.innerHTML = "";

    const content = document.createElement("div");
    content.innerHTML = `
        <p></p>

		<div class="field-row-stacked" style="width: 200px">
		<label for="text18">Username</label>
		<input id="text18" type="text" />
		</div>
		<div class="field-row-stacked" style="width: 200px">
		<label for="text19">Password</label>
		<input id="text19" type="text" />
		</div>

		<div class="field-row">
            <button id="loginBtn">Login</button>
			<button id="registerBtn">Register</button>
			<button id="guestBtn">Play as guest</button>
        </div>
    `;

    const simpleWindow = createWindow({
    title: "Transcendence Os",
    width: "400px",
	content: content,
    titleBarControls: {
        help: true
    }
});

	const usernameInput = content.querySelector<HTMLInputElement>("#text18")!;
	const passwordInput = content.querySelector<HTMLInputElement>("#text19")!;
	const loginBtn = content.querySelector<HTMLButtonElement>("#loginBtn")!;
	const registerBtn = content.querySelector<HTMLButtonElement>("#registerBtn")!;
	const guestBtn = content.querySelector<HTMLButtonElement>("#guestBtn")!;

	// Attach handlers
	loginBtn.addEventListener("click", () => {
		if (!usernameInput.value.trim() || !passwordInput.value.trim()) {
			alert("Please fill in both fields");
			return;
		}
		router.navigate("/desktop"); // or do real login
	});

	registerBtn.addEventListener("click", () => router.navigate("/register"));
	guestBtn.addEventListener("click", () => router.navigate("/guest"));


	root.append(simpleWindow);

    //root.appendChild(loginWindow);
}
