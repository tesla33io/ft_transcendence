import { Router } from "../router";
import { createWindow } from "./components";

export function tournamentView(router: Router) {
  const root = document.getElementById("app")!;
  root.innerHTML = "";

  // Create the main content container
  const content = document.createElement("div");
  content.style.textAlign = "center"; // Center-align content for better layout

  // --- Join Tournament Button ---
  
  const joinTournamentBtn = document.createElement("button");
  joinTournamentBtn.id = "joinTournamentBtn";
  joinTournamentBtn.textContent = "Join Tournament";
  joinTournamentBtn.style.marginBottom = "20px"; // Add spacing below the button
  joinTournamentBtn.style.marginTop = "20px"
  content.appendChild(joinTournamentBtn);
  
 
  // --- Waiting for Players Section ---
  const waitingText = document.createElement("div");
  waitingText.id = "waitingText";
  waitingText.textContent = "Waiting for players...";
  waitingText.style.display = "none"; // Initially hidden
  waitingText.style.marginTop = "20px";
  waitingText.style.marginBottom = "15px"
  content.appendChild(waitingText);

  // --- Progress Indicator ---
  const progressIndicator = document.createElement("div");
  progressIndicator.className = "progress-indicator segmented ";
  progressIndicator.style.display = "none"; // Initially hidden

  const progressBar = document.createElement("span");
  progressBar.className = "progress-indicator-bar";
  progressBar.style.width = "0%"; // Start at 0%
  progressIndicator.appendChild(progressBar);

  content.appendChild(progressIndicator);

  // --- Join Tournament Button Click Event ---
  joinTournamentBtn.addEventListener("click", async () => {
    joinTournamentBtn.disabled = true; // Disable the button to prevent multiple clicks
    waitingText.style.display = "block"; // Show the waiting text
    progressIndicator.style.display = "block"; // Show the progress bar

    try {
      // Simulate API call to join the tournament
      const playersConnected = await joinTournamentAPI();

      // Update the progress bar as players join
      updateProgressBar(playersConnected, progressBar);//implement so logic in websocket handler to call these functions

      // Navigate to the tournament room once all players are connected
      if (playersConnected === 4) {
    		router.navigate("/tournament/id=1");
      }
    } catch (error) {
      console.error("Error joining tournament:", error);
      joinTournamentBtn.disabled = false; // Re-enable the button on error
    }
  });

  // --- Create the Window ---
  const simpleWindow = createWindow({
    title: "Tournament Room",
    width: "400px",
    content: content,
    titleBarControls: {
      close: true,
      onClose: () => {
        router.navigate("/desktop");
      },
    },
  });

  joinTournamentBtn.addEventListener("click", () => {
	//send join que api call 
	console.log("join Tournament");
  });
  root.append(simpleWindow);
}



// Simulate API call to join the tournament
async function joinTournamentAPI(): Promise<number> {
  let playersConnected = 1;

  // Simulate waiting for players to join
  while (playersConnected < 4) {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 2 seconds
    playersConnected++;
  }

  return playersConnected;
}

// Update the progress bar based on the number of players connected
function updateProgressBar(playersConnected: number, progressBar: HTMLElement) {
  const progressPercentage = (playersConnected / 4) * 100;
  progressBar.style.width = `${progressPercentage}%`;
}