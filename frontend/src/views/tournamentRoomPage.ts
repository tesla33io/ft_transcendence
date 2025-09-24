import { Router } from "../router";
import { createWindow } from "./components";

export function tournamentRoomView(router: Router) {
    const root = document.getElementById("app")!;
    root.innerHTML = "";

    // Example data
    const tournament = {
        gameMode: "tournament",
        status: "ready",
        id: 1,
        players: ["Alice", "Bob", "Charlie", "David"],
    };

    const content = document.createElement("div");
    content.className = "tournament-tree";

    // Left column: semifinals
    const semifinals = document.createElement("div");
    semifinals.className = "round";
    semifinals.innerHTML = `<h4>Semifinals</h4>`;
    semifinals.appendChild(createMatch(tournament.players[0], tournament.players[1], "joined", "joined"));
    semifinals.appendChild(createMatch(tournament.players[2], tournament.players[3], "joined", "joined"));

    // Middle column: final
    const final = document.createElement("div");
    final.className = "round";
    final.innerHTML = `<h4>Final</h4>`;
    final.appendChild(createMatch("Winner SF1", "Winner SF2", "joined", "joined"));

    // Right column: champion
    const champion = document.createElement("div");
    champion.className = "round";
    champion.innerHTML = `<h4>Champion</h4>
        <div class="winner-slot">TBD</div>`;

    content.appendChild(semifinals);
    content.appendChild(final);
    content.appendChild(champion);

    const bracketsWindow = createWindow({
        title: "Tournament",
        width: "700px",
        content: content,
        titleBarControls: {
            close: true,
            onClose: () => router.navigate("/desktop"),
        },
    });

    root.append(bracketsWindow);
}

// -------------------------------
// Match box
// -------------------------------
function createMatch(
    player1: string,
    player2: string,
    state1: "joined" | "win" | "loss",
    state2: "joined" | "win" | "loss"
): HTMLElement {
    const match = document.createElement("div");
    match.className = "match";

    const p1 = document.createElement("div");
    p1.textContent = player1;
    p1.classList.add("slot", state1);

    const p2 = document.createElement("div");
    p2.textContent = player2;
    p2.classList.add("slot", state2);

    match.appendChild(p1);
    match.appendChild(p2);

    return match;
}
