import { Router } from '../router';
import { createWindow } from './components';
import agent from "./images/msagent.png"
import book_user from "./images/book_user.png"
import rabit from "./images/rabit.png"

export function settingsView(router: Router) {
	const app = document.getElementById('app');
	if (!app) {
		console.error("App element not found!");
		return;
	}

	const content = document.createElement("div");

	// ----------------------------
	// Name change section
	// ----------------------------
	content.innerHTML = `
		<p></p>

		<div class="field-row-stacked" style="width: 200px">
			<label for="current_name">Current Name</label>
			<input id="current_name" type="text" value="Current Player Name" disabled />
		</div>
		<div class="field-row-stacked" style="width: 200px">
			<label for="new_name">New Name</label>
			<input id="new_name" type="text" placeholder="Enter new name" />
		</div>
	`;

	// ----------------------------
	// Avatar selection section
	// ----------------------------
	const avatarSection = document.createElement("div");
	avatarSection.innerHTML = `<label>Change Avatar</label>`;
	avatarSection.style.marginTop = "20px";

	// Current avatar display
	const currentAvatarDiv = document.createElement("div");
	currentAvatarDiv.innerHTML = `<label>Current Avatar:</label>`;
	currentAvatarDiv.style.marginBottom = "10px";

	const currentAvatar = document.createElement("img");
	currentAvatar.src = agent; // TODO: Get from backend/localStorage
	currentAvatar.width = 60;
	currentAvatar.height = 60;
	currentAvatar.style.border = "2px solid #000";
	currentAvatar.style.display = "block";
	currentAvatar.style.marginTop = "5px";

	currentAvatarDiv.appendChild(currentAvatar);
	avatarSection.appendChild(currentAvatarDiv);

	// New avatar selection
	const newAvatarLabel = document.createElement("label");
	newAvatarLabel.textContent = "Select New Avatar:";
	newAvatarLabel.style.display = "block";
	newAvatarLabel.style.marginTop = "15px";
	avatarSection.appendChild(newAvatarLabel);

	const avatarContainer = document.createElement("div");
	avatarContainer.style.display = "flex";
	avatarContainer.style.gap = "10px";
	avatarContainer.style.marginTop = "5px";

	const avatars = [agent, book_user, rabit];
	avatars.forEach(src => {
		const img = document.createElement("img");
		img.src = src;
		img.width = 50;
		img.height = 50;
		img.style.cursor = "pointer";
		img.style.border = "2px solid transparent";
		img.classList.add("avatar-option");

		img.addEventListener("click", () => {
			// Remove old selection
			avatarContainer.querySelectorAll(".avatar-option").forEach(a => {
				(a as HTMLElement).style.border = "2px solid transparent";
				a.classList.remove("selected");
			});
			// Add new selection
			img.style.border = "2px solid #0000ff";
			img.classList.add("selected");
			avatarInput.value = src;
		});

		avatarContainer.appendChild(img);
	});

	const avatarInput = document.createElement("input");
	avatarInput.type = "hidden";
	avatarInput.id = "new_avatar";

	avatarSection.appendChild(avatarContainer);
	avatarSection.appendChild(avatarInput);

	// Upload custom avatar
	const uploadLabel = document.createElement("label");
	uploadLabel.textContent = "Or upload custom avatar:";
	uploadLabel.style.display = "block";
	uploadLabel.style.marginTop = "10px";

	const uploadInput = document.createElement("input");
	uploadInput.type = "file";
	uploadInput.accept = "image/*";

	uploadInput.addEventListener("change", () => {
		const file = uploadInput.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				avatarInput.value = e.target!.result as string;
				// Clear preset selections
				avatarContainer.querySelectorAll(".avatar-option").forEach(a => {
					(a as HTMLElement).style.border = "2px solid transparent";
					a.classList.remove("selected");
				});
			};
			reader.readAsDataURL(file);
		}
	});

	avatarSection.appendChild(uploadLabel);
	avatarSection.appendChild(uploadInput);

	// Append avatar section to content
	content.appendChild(avatarSection);

	// ----------------------------
	// Action buttons
	// ----------------------------
	const buttonContainer = document.createElement("div");
	buttonContainer.className = "field-row";
	buttonContainer.style.marginTop = "20px";
	buttonContainer.style.gap = "10px";

	const saveBtn = document.createElement("button");
	saveBtn.id = "saveBtn";
	saveBtn.textContent = "Save Changes";

	const cancelBtn = document.createElement("button");
	cancelBtn.id = "cancelBtn";
	cancelBtn.textContent = "Cancel";

	buttonContainer.appendChild(saveBtn);
	buttonContainer.appendChild(cancelBtn);
	content.appendChild(buttonContainer);

	// ----------------------------
	// Create window
	// ----------------------------
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

	// ----------------------------
	// Collect data and handle events
	// ----------------------------
	function getSettingsData() {
		const newName = (content.querySelector<HTMLInputElement>("#new_name")!).value;
		const newAvatar = (content.querySelector<HTMLInputElement>("#new_avatar")!).value;

		return { newName, newAvatar };
	}

	saveBtn.addEventListener("click", () => {
		const data = getSettingsData();
		console.log("Settings data to save:", data);

		// TODO: Send to backend
		// TODO: Update localStorage/session storage
		
		// For now, just navigate back
		router.navigate("/desktop");
	});

	cancelBtn.addEventListener("click", () => {
		router.navigate("/desktop");
	});

	app.innerHTML = '';
	app.appendChild(setupWindow);
}