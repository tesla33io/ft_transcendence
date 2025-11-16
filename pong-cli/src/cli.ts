import { login } from "./command/login"
import { logout } from "./command/logout"
import { entryMenu } from "./ui/entryMenu"
import { MainMenu } from "./ui/mainMenu"
import { clearConfig, loadConfig } from "./core/config"
import { GameMenu } from "./ui/gameMenu"
import { joinGame } from "./command/JoinGame"
import { GameWebsocket } from "./network/GameWebSocket"

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
	const mainMenu = new MainMenu()

	while (true) {
		const mode = await mainMenu.show();

		if (mode === "game") {
			await handleGameMenu()
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
			mainMenu.destroy()
			break
		}

	}
}

async function handleGameMenu(){
	const gameMenu = new GameMenu()

	while (true){
		const mode = await gameMenu.show()

		if (mode === "classic"){
			startGameFlow("classic")
		}
		else if (mode === "tournament"){
			console.log("Tournament mode (placeholder)...");
		}

		else if (mode === "bot-classic"){
			startGameFlow("ai")
			continue
		}

		else if (mode === "back"){
			gameMenu.destroy()
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
		await GameWebsocket.connectToGame(route, join.gameId, config?.id)

		console.log("Press any key to return...");
		// await waitForKey();

	} catch (err: any) {
		console.log("Failed to start game:", err.message);
		// await waitForKey();
	}
}

start()
