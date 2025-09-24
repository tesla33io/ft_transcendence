import { Router } from "../router";
import { createWindow } from "./components";


export function tournamentView(router: Router) {
	const root = document.getElementById("app")!;
		root.innerHTML = "";

		const content = document.createElement("div");
		//placeholder get api call get current tournaments or other join logic auto matching ? 
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
			
		`;

		const buttonContainer = document.createElement("div");
		buttonContainer.className = "field-row";
		buttonContainer.style.marginTop = "15px";

		const joinTournamentBtn = document.createElement("button");
		joinTournamentBtn.id = "joinTournamentBtn";
		joinTournamentBtn.textContent = "Join Tournament";

		buttonContainer.appendChild(joinTournamentBtn);
		content.appendChild(buttonContainer);

		joinTournamentBtn.addEventListener("click", () => {
        console.log("Join tournament Room :");
		//TODO get which room selected 
		//send api join call
		//go to tournament room page 
        router.navigate("/tournament/id=1");
    	});


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


