import { login } from "./command/login"
import { logout } from "./command/logout"
import { inputPrompt } from "./ui/inputPromt"
import { entryMenu } from "./ui/entryMenu"
import { mainMenu } from "./ui/mainMenu"
import { clearConfig, loadConfig } from "./core/config"
import { gameMenu } from "./ui/gameMenu"
import { joinGame } from "./command/JoinGame"
import { GameWebsocket } from "./network/gameSocket"

async function start() {

	while (1){
		const choise = await entryMenu()

		switch (choise){
			case "login":
				console.log("---Login---")
				const ok = await login()
				if (ok){
					await handleMainMenu()
				}
				continue

			case "register":
				console.log("---register---")
				//register promt
				continue

			case "exit":
				clearConfig()
				console.log("---exit---")
				process.exit(0)
		}
	}
}

async function handleMainMenu() {
	while (true) {
		const mode = await mainMenu();

		if (mode === "game") {
			await handleGameMenu()
			break
		}

		else if (mode === "profile") {
			console.log("Profile (placeholder)...");
		}

		else if (mode === "setting") {
			console.log("Setting (placeholder)...");
		}

		else if (mode === "logout") {
			await logout()
			clearConfig()
			break
		}
	}
}

async function handleGameMenu(){
	while (true){
		const mode = await gameMenu()

		if (mode === "classic"){
			startGameFlow("classic")
		}

		else if (mode === "tournament"){
			console.log("Tournament mode (placeholder)...");
		}

		else if (mode === "bot-classic"){
			startGameFlow("ai")

		}

		else if (mode === "back"){
			break
		}
	}
}

async function startGameFlow(mode: string){
	const config = loadConfig()

	let route: string = mode
	if (mode === "ai" )
		route = "classic"

	if (!config)
		return false

	try {
		const join = await joinGame(mode);
		console.log("Match ID:", join.gameId, join)
		await GameWebsocket.connectToGame(route, join.gameId, config?.id)

		console.log("Press any key to return...");
		// await waitForKey();

	} catch (err: any) {
		console.log("Failed to start game:", err.message);
		// await waitForKey();
	}
}

start()
