import { Router } from "../router";
import { createWindow } from "./components";

export async function tournamentRoomView(router: Router) {
  const root = document.getElementById("app")!;
  root.innerHTML = "";

  // Fetch tournament data from the backend
  const tournament = await fetchTournamentData();//make this some knid of function that gets called from websocket handler 

  // Create the main content container
  const content = document.createElement("div");
  content.className = "grid grid-cols-3 gap-4 p-4 relative"; // Tailwind grid: 3 columns, gap between columns, padding

  // --- Semifinals (Column 1) ---
  const semifinals = document.createElement("div");
  semifinals.className = "flex flex-col items-center"; // Stack matches vertically
  semifinals.innerHTML = `<h4 class="text-sm font-bold mb-2">Semifinals</h4>`;
  semifinals.appendChild(createMatch(tournament.players[0], tournament.players[1], "joined", "joined"));
  semifinals.appendChild(createMatch(tournament.players[2], tournament.players[3], "joined", "joined"));

  // --- Final (Column 2) ---
  const final = document.createElement("div");
  final.className = "flex flex-col items-center justify-center self-center"; // Center vertically and horizontally
  final.innerHTML = `<h4 class="text-sm font-bold mb-2">Final</h4>`;
  final.appendChild(createMatch(tournament.final[0], tournament.final[1], "placeholder", "placeholder"));

  // --- Champion (Column 3) ---
  const champion = document.createElement("div");
  champion.className = "flex flex-col items-center justify-center self-center"; // Center-align the champion
  champion.innerHTML = `<h4 class="text-sm font-bold mb-2">Champion</h4>
    <div class="winner-slot border border-gray-400 p-2 w-32 text-center text-gray-500">Winner of Final</div>`;

  // Append columns to the grid
  content.appendChild(semifinals);
  content.appendChild(final);
  content.appendChild(champion);

  // --- Ready Button ---
  const readyButton = document.createElement("button");
  readyButton.textContent = "Ready";
  readyButton.className = "button"; // 98.css button class
  readyButton.style.position = "absolute"; // Position the button
  readyButton.style.bottom = "20px";
  readyButton.style.right = "20px";
  readyButton.style.padding = "8px 16px"; // Add padding for better appearance

  // Add an event listener to the button
  readyButton.addEventListener("click", () => {
    console.log("You are ready for the game!");
    readyButton.disabled = true; // Disable the button
    readyButton.textContent = "Ready!";
    readyButton.style.color = "#010081"
  });

  // Append the button to the content
  content.appendChild(readyButton);

  // Create the tournament window
  const bracketsWindow = createWindow({
    title: "Tournament",
    width: "700px",
    content: content,
    titleBarControls: {
      close: true,
      onClose: () => router.navigate("/desktop"),//make some diconnection logic with websocket 
    },
  });

  root.append(bracketsWindow);
}

// -------------------------------
// Fetch tournament data from the backend
// -------------------------------
async function fetchTournamentData() {
  // Simulate an API call to fetch tournament data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        players: ["Alice", "Bob", "Charlie", "David"],
        final: [null, null], // Placeholder for final match
        champion: null, // Placeholder for champion
      });
    }, 1000); // Simulate 1-second delay
  });
}

// -------------------------------
// Match box
// -------------------------------
function createMatch(
  player1: string | null, // Allow null for placeholders
  player2: string | null, // Allow null for placeholders
  state1: "joined" | "win" | "loss" | "placeholder", 
  state2: "joined" | "win" | "loss" | "placeholder"
): HTMLElement {
  const match = document.createElement("div");
  match.className = "flex flex-col items-center border border-gray-400 p-2 mb-4 w-32 window"; // Add 98.css "window" class
  match.style.border = `2px solid #a5a9a6`; // Add custom border color
  match.style.boxShadow = `inset 2px 2px 0px #ffffff, inset -2px -2px 0px #808080`; // 3D inset effect

  // Player 1
  const p1 = document.createElement("div");
  p1.textContent = player1 || "Winner of Semifinal"; // Placeholder text if player1 is null
  p1.classList.add(
    "slot",
    state1,
    "text-center",
    "mb-2",
    "w-full",
    "p-1",
    player1 ? "bg-color" : "text-gray-500" // Light gray text for placeholders
  );

  // Player 2
  const p2 = document.createElement("div");
  p2.textContent = player2 || "Winner of Semifinal"; // Placeholder text if player2 is null
  p2.classList.add(
    "slot",
    state2,
    "text-center",
    "w-full",
    "p-1",
    player2 ? "bg-gray-500" : "text-gray-500" // Light gray text for placeholders
  );

  match.appendChild(p1);
  match.appendChild(p2);

  return match;
}

