import { Router } from "../router";
import { createWindow, MatchHistory,Stats } from "./components";
import type { Match,StatsData } from "./components";

    export function profileView(router: Router) {
    const root = document.getElementById("app")!;
    root.innerHTML = "";

    // Container for profile content
    const content = document.createElement("div");
    // Wrap everything in a simple window
    const simpleWindow = createWindow({
        title: "Profile",
        width: "450px",
        content: content,
        titleBarControls: {
        close: true,
        onClose: () => router.navigate("/desktop")
        }
    });

    root.appendChild(simpleWindow);

    const statsHeading = document.createElement("h3");
    statsHeading.textContent = "your Stats";
    statsHeading.style.marginBottom = "10px";
    content.appendChild(statsHeading);

    const statsDiv = document.createElement("div");
    statsDiv.id = "stats-panel";
    statsDiv.style.marginBottom = "20px";
    content.appendChild(statsDiv);

    const placeholderStats: StatsData = {
    wins: 12,
    losses: 8,
    tournamentsWon: 3,
    elo: 1700,
    eloHistory: [
        { date: "2025-01-01", elo: 1300 },
        { date: "2025-02-01", elo: 1200 },
        { date: "2025-03-01", elo: 1400 },
        { date: "2025-04-01", elo: 1450 },
        { date: "2025-01-01", elo: 1500 },
        { date: "2025-02-01", elo: 1400 },
        { date: "2025-03-01", elo: 1700 },
    ],
    };

    new Stats(statsDiv, placeholderStats);




    // Add a text/heading above match history
    const historyheading = document.createElement("h3");
    historyheading.textContent = "Your Match History";
    historyheading.style.marginBottom = "10px";
    content.appendChild(historyheading);

    // Add a div for match history table
    const matchHistoryDiv = document.createElement("div");
    matchHistoryDiv.id = "match-history";
    matchHistoryDiv.className = "sunken-panel";
    matchHistoryDiv.style.width = "250px";
    content.appendChild(matchHistoryDiv);

    // Example match data (replace later with API call)
    const matchData: Match[] = [
        { opponent: 'Alice', result: 'Win', value: 'Placeholder' },
        { opponent: 'Bob', result: 'Lose', value: 'Placeholder' },
        { opponent: 'Charlie', result: 'Win', value: 'Placeholder' },
        { opponent: 'David', result: 'Lose', value: 'Placeholder' },
        { opponent: 'Eve', result: 'Win', value: 'Placeholder' },
        { opponent: 'Frank', result: 'Lose', value: 'Placeholder' },
        { opponent: 'Grace', result: 'Win', value: 'Placeholder' },
    ];

    // Initialize the match history component
    new MatchHistory("match-history", matchData);

    
}
