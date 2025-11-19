import { Router } from "../router";
import { createWindow } from "../components/_components";
import { WebSocketHandler } from "../game/websocketHandler";
import { createTaskbar, createStaticDesktopBackground } from "../components/_components";
import { UserService } from "../game/userService";

// Helper function to convert tournament string ID to integer (same as backend)
function convertTournamentIdToInt(tournamentId: string): number {
    // If it's already numeric, use it
    if (/^\d+$/.test(tournamentId)) {
        return parseInt(tournamentId);
    }
    // Otherwise, create a hash from the string
    let hash = 0;
    for (let i = 0; i < tournamentId.length; i++) {
        const char = tournamentId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

export function tournamentRoomView(
	router: Router,
	tournamentData: any,
	wsHandler: WebSocketHandler
	) {
	const root = document.getElementById("app")!;
	root.innerHTML = "";
	
	const staticBackground = createStaticDesktopBackground();
    staticBackground.attachToPage(root);
	
	const content = document.createElement("div");
	content.className = "grid grid-cols-3 gap-4 p-4 relative";

	// Semifinals
	const semifinals = document.createElement("div");
	semifinals.className = "flex flex-col items-center";
	semifinals.innerHTML = `<h4 class="text-sm font-bold mb-2">Semifinals</h4>`;
	
	const match0 = tournamentData.bracket[0];
	const match1 = tournamentData.bracket[1];
	
	semifinals.appendChild(createMatch(
		match0?.player1?.name ?? null,
		match0?.player2?.name ?? null,
		match0?.winner?.id === match0?.player1?.id ? "win" : match0?.status === "finished" ? "loss" : "joined",
		match0?.winner?.id === match0?.player2?.id ? "win" : match0?.status === "finished" ? "loss" : "joined"
	));
	semifinals.appendChild(createMatch(
		match1?.player1?.name ?? null,
		match1?.player2?.name ?? null,
		match1?.winner?.id === match1?.player1?.id ? "win" : match1?.status === "finished" ? "loss" : "joined",
		match1?.winner?.id === match1?.player2?.id ? "win" : match1?.status === "finished" ? "loss" : "joined"
	));

	// Final
	const final = document.createElement("div");
	final.className = "flex flex-col items-center justify-center self-center";
	final.innerHTML = `<h4 class="text-sm font-bold mb-2">Final</h4>`;
	
	const finalMatch = tournamentData.bracket[2];
	final.appendChild(createMatch(
		finalMatch?.player1?.name ?? null,
		finalMatch?.player2?.name ?? null,
		finalMatch?.winner?.id === finalMatch?.player1?.id ? "win" : finalMatch?.status === "finished" ? "loss" : "placeholder",
		finalMatch?.winner?.id === finalMatch?.player2?.id ? "win" : finalMatch?.status === "finished" ? "loss" : "placeholder"
	));

	// Champion - Find and display the winner's name
	const champion = document.createElement("div");
	champion.className = "flex flex-col items-center justify-center self-center";
	
	let championName = "Winner of Final";
	let isFinished = false;

	// Check if tournament is finished and get winner's name
	if (tournamentData.status === "finished" && tournamentData.winner) {
		isFinished = true;
		// Find the winner's name from the bracket
		const winnerPlayer = tournamentData.bracket
			.flatMap((match: any) => [match.player1, match.player2])
			.find((player: any) => player?.id === tournamentData.winner);
		championName = winnerPlayer?.name || `Player ${tournamentData.winner}`;
	}

	// Add the title above the box
	const championTitle = document.createElement("h4");
	championTitle.className = "text-sm font-bold mb-2";
	championTitle.textContent = "Champion";
	champion.appendChild(championTitle);

	// The styled box for the champion's name
	const championBox = document.createElement("div");
	championBox.className = "flex flex-col items-center border border-gray-400 p-2 mb-4 w-32 window";
	championBox.style.border = `2px solid #a5a9a6`;
	championBox.style.boxShadow = `inset 2px 2px 0px #ffffff, inset -2px -2px 0px #808080`;

	// The champion's name
	const p1 = document.createElement("div");
	p1.textContent = championName;
	p1.classList.add("slot", "text-center", "w-full", "p-1");

	// Add styling based on whether tournament is finished
	if (isFinished) {
		p1.classList.add("font-bold"); // Bold for actual winner
		championBox.style.backgroundColor = "#fff3cd"; // Light yellow background for winner
	} else {
		p1.classList.add("text-gray-500"); // Gray for placeholder
	}

	championBox.appendChild(p1);
	champion.appendChild(championBox);

	content.appendChild(semifinals);
	content.appendChild(final);
	content.appendChild(champion);

	// Ready Button or Back Button
	if (tournamentData.status !== "finished") {
		const readyButton = document.createElement("button");
		readyButton.textContent = "Ready";
		readyButton.className = "button";
		readyButton.style.position = "absolute";
		readyButton.style.bottom = "20px";
		readyButton.style.right = "20px";
		readyButton.style.padding = "8px 16px";

		readyButton.addEventListener("click", () => {
		wsHandler.sendTournamentReady();
		readyButton.disabled = true;
		readyButton.textContent = "Ready!";
		readyButton.style.color = "#010081";
		});

		content.appendChild(readyButton);
	} else {
		// Tournament finished - show blockchain info
		const tournamentIdInt = convertTournamentIdToInt(tournamentData.id);
		
		// Create info section for blockchain hash
		const blockchainInfo = document.createElement("div");
		blockchainInfo.style.cssText = "position: absolute; bottom: 20px; left: 20px; padding: 10px; background: #f0f0f0; border: 1px solid #ccc; border-radius: 4px;";
		blockchainInfo.innerHTML = `
			<div style="font-size: 12px; margin-bottom: 5px;">
				<strong>Tournament ID:</strong> ${tournamentIdInt}
			</div>
			<div id="blockchain-hash" style="font-size: 11px; color: #666;">
				Loading blockchain hash...
			</div>
		`;
		content.appendChild(blockchainInfo);

		// Fetch blockchain hash with retry logic that accounts for 5-10 second blockchain processing
		const fetchBlockchainHash = async (retries = 10, initialDelay = 2000) => {
			for (let i = 0; i < retries; i++) {
				try {
					const hashData = await UserService.getTournamentBlockchainHash(tournamentIdInt);
					const hashDiv = document.getElementById("blockchain-hash");
					if (hashDiv) {
						hashDiv.innerHTML = `
							<strong>TX Hash:</strong> <a href="https://testnet.snowtrace.io/tx/${hashData.blockchainTxHash}" target="_blank" style="color: #0066cc; text-decoration: underline;">${hashData.blockchainTxHash}</a><br>
							<strong>Status:</strong> ${hashData.status}
						`;
						hashDiv.style.color = hashData.status === 'confirmed' ? '#00aa00' : '#ff8800';
					}
					return; // Success, exit retry loop
				} catch (error: any) {
					const hashDiv = document.getElementById("blockchain-hash");
					if (hashDiv) {
						if (i === retries - 1) {
							// Last attempt failed
							hashDiv.textContent = `Error: ${error.message || 'Failed to load hash after multiple attempts'}`;
							hashDiv.style.color = 'red';
						} else {
							// Still retrying - show progress
							const elapsed = Math.round((i + 1) * initialDelay / 1000);
							hashDiv.textContent = `Waiting for blockchain transaction... (${elapsed}s elapsed, attempt ${i + 1}/${retries})`;
							hashDiv.style.color = '#666';
						}
					}
					
					// Exponential backoff: longer delays for 404 errors (tournament still finalizing)
					// For 404: 2s, 3s, 4s, 5s... (covers up to ~20 seconds)
					// For other errors: 2s, 2s, 2s... (covers up to ~20 seconds)
					if (i < retries - 1) {
						let waitTime = initialDelay;
						if (error.status === 404) {
							// Exponential backoff for 404: 2s, 3s, 4s, 5s...
							waitTime = initialDelay + (i * 1000);
						}
						await new Promise(resolve => setTimeout(resolve, waitTime));
					}
				}
			}
		};
		
		fetchBlockchainHash();

		const backButton = document.createElement("button");
		backButton.textContent = "Back to Menu";
		backButton.className = "button";
		backButton.style.position = "absolute";
		backButton.style.bottom = "20px";
		backButton.style.right = "20px";
		backButton.style.padding = "8px 16px";

		backButton.addEventListener("click", () => {
		router.navigate("/desktop");
		});

		content.appendChild(backButton);
	}

	const bracketsWindow = createWindow({
		title: tournamentData.status === "finished" ? "Tournament Complete! 🏆" : "Tournament",
		width: "700px",
		content: content,
		titleBarControls: {
		close: true,
		onClose: () => {
			router.navigateToDesktop()
			if (wsHandler)
					wsHandler.disconnect();
		}
		},
	});

	root.append(bracketsWindow);
	
	const { taskbar } = createTaskbar({
		clock: true,
		router: router
	});
	
	root.appendChild(taskbar);

}
	// Helper to create a match box
	function createMatch(
	player1: string | null,
	player2: string | null,
	state1: "joined" | "win" | "loss" | "placeholder",
	state2: "joined" | "win" | "loss" | "placeholder"
	): HTMLElement {
	const match = document.createElement("div");
	match.className = "flex flex-col items-center border border-gray-400 p-2 mb-4 w-32 window";
	match.style.border = `2px solid #a5a9a6`;
	match.style.boxShadow = `inset 2px 2px 0px #ffffff, inset -2px -2px 0px #808080`;

	const p1 = document.createElement("div");
	p1.textContent = player1 || "Winner of Semifinal";
	p1.classList.add("slot", state1, "text-center", "mb-2", "w-full", "p-1", player1 ? "bg-color" : "text-gray-500");
	
	// Add visual styling for winners/losers
	if (state1 === "win") p1.classList.add( "font-bold");
	if (state1 === "loss") p1.classList.add( "line-through");

	const p2 = document.createElement("div");
	p2.textContent = player2 || "Winner of Semifinal";
	p2.classList.add("slot", state2, "text-center", "w-full", "p-1", player2 ? "bg-gray-500" : "text-gray-500");
	
	if (state2 === "win") p2.classList.add( "font-bold");
	if (state2 === "loss") p2.classList.add( "line-through");

	match.appendChild(p1);
	match.appendChild(p2);

	return match;
	}

