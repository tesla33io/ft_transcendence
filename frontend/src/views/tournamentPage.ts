import { Router } from "../router";
import { createWindow } from "./components";


export function tournamentView(router: Router) {
	const root = document.getElementById("app")!;
		root.innerHTML = "";

		const content = document.createElement("div");
		content.innerHTML = `
			<fieldset>
			<div class="field-row">Select a tournament to join:</div>
			<div class="field-row">
				<input id="radio10" type="radio" name="fieldset-example">
				<label for="radio10">linus Room</label>
			</div>
			<div class="field-row">
				<input id="radio11" type="radio" name="fieldset-example">
				<label for="radio11">max Room</label>
			</div>
			<div class="field-row">
				<input id="radio12" type="radio" name="fieldset-example">
				<label for="radio12">Felix Room</label>
			</div>
			</fieldset>
			<button class="default">Join Tournament Room</button>
		`;

		const simpleWindow = createWindow({
		title: "Tournament",
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
