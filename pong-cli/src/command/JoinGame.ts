import { loadConfig } from "../core/config";

export interface JoinGameResponse {
	wsUrl: string;
	matchId: string;
}

export async function joinGame(mode: string): Promise<JoinGameResponse> {
	const config = loadConfig();
	let apiEndpoint: string
	console.log("Mode: ", mode)
	if(mode === "tournament"){
		apiEndpoint = '/api/v1/game/join-tournament'
	}
	else if (mode === "ai"){
		apiEndpoint = '/api/v1/game/bot-classic'
	}
	else{
		apiEndpoint = '/api/v1/game/join-classic'
	}

	const joinReq = {
		playerId: config?.id,
		playerName: config?.name,
		gameMode: mode,
		timestamp: new Date().toISOString()
	}
	console.log(`Trying to join ${apiEndpoint}`)
	const res = await fetch(`http://localhost:3000${apiEndpoint}`, {
		method: "POST",
		headers: {
		"Content-Type": "application/json",
		"Authorization": `Bearer ${config?.sessionId}`,
		},
		body: JSON.stringify(joinReq)
	});

	if (!res.ok) {
		throw new Error(`Join failed: ${res.statusText}`);
	}

	return res.json();
}
