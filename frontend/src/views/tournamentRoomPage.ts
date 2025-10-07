import { Router } from "../router";
import { createWindow } from "./components";
import { WebSocketHandler } from "../game/websocketHandler";

export function tournamentRoomView(
  router: Router,
  tournamentData: any,
  wsHandler: WebSocketHandler
) {
  const root = document.getElementById("app")!;
  root.innerHTML = "";

  const content = document.createElement("div");
  content.className = "grid grid-cols-3 gap-4 p-4 relative";

  // Semifinals
  const semifinals = document.createElement("div");
  semifinals.className = "flex flex-col items-center";
  semifinals.innerHTML = `<h4 class="text-sm font-bold mb-2">Semifinals</h4>`;
  semifinals.appendChild(createMatch(
    tournamentData.bracket[0]?.player1?.name ?? null,
    tournamentData.bracket[0]?.player2?.name ?? null,
    "joined", "joined"
  ));
  semifinals.appendChild(createMatch(
    tournamentData.bracket[1]?.player1?.name ?? null,
    tournamentData.bracket[1]?.player2?.name ?? null,
    "joined", "joined"
  ));

  // Final
  const final = document.createElement("div");
  final.className = "flex flex-col items-center justify-center self-center";
  final.innerHTML = `<h4 class="text-sm font-bold mb-2">Final</h4>`;
  final.appendChild(createMatch(
    tournamentData.final?.player1?.name ?? null,
    tournamentData.final?.player2?.name ?? null,
    "placeholder", "placeholder"
  ));

  // Champion
  const champion = document.createElement("div");
  champion.className = "flex flex-col items-center justify-center self-center";
  champion.innerHTML = `<h4 class="text-sm font-bold mb-2">Champion</h4>
    <div class="winner-slot border border-gray-400 p-2 w-32 text-center text-gray-500">
      ${tournamentData.champion?.name ?? "Winner of Final"}
    </div>`;

  content.appendChild(semifinals);
  content.appendChild(final);
  content.appendChild(champion);

  // Ready Button
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

  const p2 = document.createElement("div");
  p2.textContent = player2 || "Winner of Semifinal";
  p2.classList.add("slot", state2, "text-center", "w-full", "p-1", player2 ? "bg-gray-500" : "text-gray-500");

  match.appendChild(p1);
  match.appendChild(p2);

  return match;
}

