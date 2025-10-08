import { Router } from "../router";
import { createWindow } from "./components";


export function friendsView(router: Router) {
	const root = document.getElementById("app")!;
		root.innerHTML = "";

		const content = document.createElement("div");
		content.innerHTML = `
			<p>Add your friend</p>

			<div class="field-row-stacked" style="width: 200px">
			<label for="text18">Friends username:</label>
			<input id="text18" type="text" />
			</div>

			<div class="field-row">
				<button id="send_Friend_Request">send Friend Request</button>

			</div>
		`;

		const simpleWindow = createWindow({
		title: "Friends",
		width: "400px",
		content: content,
		titleBarControls: {
			close: true,
			onClose: () => {
				router.navigate("/desktop")
			}
		}
	});

	root.append(simpleWindow);

}
