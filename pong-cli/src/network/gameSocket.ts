import Websocket from 'ws'

export async function connectToGame(wsUrl: string) {
	return new Promise<void>((resolve, reject) => {
		const ws = new Websocket(wsUrl);

		ws.onopen = () => {
			console.log("Connected to game server!");
			resolve();
		};

		ws.onerror = (err) => {
			console.log("WebSocket error", err);
			reject(err);
		};

		ws.onclose = () => {
			console.log("Game connection closed.");
		};

		ws.onmessage = (msg) => {
			try {
				const data = JSON.parse(msg.data.toString());
				handleGameEvent(data);
			} catch (err) {
				console.log("Invalid WS message:", msg.data);
			}
		};
	});
}

function handleGameEvent(event: any) {
	switch (event.type) {
		case "GAME_STATE":
		console.log("Game state:", event.state);
		break;

		case "PADDLE_UPDATE":
		console.log("Paddle update:", event);
		break;

		case "SCORE":
		console.log(`Score: ${event.left} - ${event.right}`);
		break;

		case "MATCH_END":
		console.log("Match ended:", event.result);
		break;

		default:
		console.log("Unknown event:", event);
	}
}
