import { Router } from "../router";
import { createWindow } from "./_components";
import { WebSocketHandler } from "../game/websocketHandler";
import { createTaskbar, createStaticDesktopBackground } from "./_components";

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

    // Track listeners for cleanup
    let listeners: Array<{ element: Element; event: string; handler: EventListener }> = [];

    // Semifinals
    const semifinals = document.createElement("div");
    semifinals.className = "flex flex-col items-center";
    
    const semifinalsTitle = document.createElement("h4");
    semifinalsTitle.className = "text-sm font-bold mb-2";
    semifinalsTitle.textContent = "Semifinals";
    semifinals.appendChild(semifinalsTitle);
    
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
    
    const finalTitle = document.createElement("h4");
    finalTitle.className = "text-sm font-bold mb-2";
    finalTitle.textContent = "Final";
    final.appendChild(finalTitle);
    
    const finalMatch = tournamentData.bracket[2];
    final.appendChild(createMatch(
        finalMatch?.player1?.name ?? null,
        finalMatch?.player2?.name ?? null,
        finalMatch?.winner?.id === finalMatch?.player1?.id ? "win" : finalMatch?.status === "finished" ? "loss" : "placeholder",
        finalMatch?.winner?.id === finalMatch?.player2?.id ? "win" : finalMatch?.status === "finished" ? "loss" : "placeholder"
    ));

    // Champion
    const champion = document.createElement("div");
    champion.className = "flex flex-col items-center justify-center self-center";
    
    let championName = "Winner of Final";
    let isFinished = false;

    if (tournamentData.status === "finished" && tournamentData.winner) {
        isFinished = true;
        const winnerPlayer = tournamentData.bracket
            .flatMap((match: any) => [match.player1, match.player2])
            .find((player: any) => player?.id === tournamentData.winner);
        championName = winnerPlayer?.name || `Player ${tournamentData.winner}`;
    }

    const championTitle = document.createElement("h4");
    championTitle.className = "text-sm font-bold mb-2";
    championTitle.textContent = "Champion";
    champion.appendChild(championTitle);

    const championBox = document.createElement("div");
    championBox.className = "flex flex-col items-center border border-gray-400 p-2 mb-4 w-32 window";
    championBox.style.border = `2px solid #a5a9a6`;
    championBox.style.boxShadow = `inset 2px 2px 0px #ffffff, inset -2px -2px 0px #808080`;

    const p1 = document.createElement("div");
    p1.textContent = championName;
    p1.classList.add("slot", "text-center", "w-full", "p-1");

    if (isFinished) {
        p1.classList.add("font-bold");
        championBox.style.backgroundColor = "#fff3cd";
    } else {
        p1.classList.add("text-gray-500");
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

        const handleReadyClick = () => {
            wsHandler.sendTournamentReady();
            readyButton.disabled = true;
            readyButton.textContent = "Ready!";  
            readyButton.style.color = "#010081";
        };

        readyButton.addEventListener("click", handleReadyClick);
        listeners.push({ element: readyButton, event: "click", handler: handleReadyClick });

        content.appendChild(readyButton);
    } else {
        const backButton = document.createElement("button");
        backButton.textContent = "Back to Menu";  
        backButton.className = "button";
        backButton.style.position = "absolute";
        backButton.style.bottom = "20px";
        backButton.style.right = "20px";
        backButton.style.padding = "8px 16px";

        const handleBackClick = () => {
            wsHandler.disconnect();
            router.navigate("/desktop");
        };

        backButton.addEventListener("click", handleBackClick);
        listeners.push({ element: backButton, event: "click", handler: handleBackClick });

        content.appendChild(backButton);
    }

    // Cleanup function
    const cleanup = () => {
        // Remove all event listeners
        listeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        listeners = [];
        
        // Disconnect WebSocket
        wsHandler.disconnect();
		//add some dissconet session etc here 
    };

    const bracketsWindow = createWindow({
        title: tournamentData.status === "finished" ? "Tournament Complete! 🏆" : "Tournament",
        width: "700px",
        content: content,
        titleBarControls: {
            close: true,
            onClose: () => {
                cleanup();
                router.navigate("/desktop");
            },
        },
    });

    root.append(bracketsWindow);
    
    const { taskbar } = createTaskbar({
        startButton: {
            label: "Start",
            onClick: () => {
                cleanup();
                router.navigate("/");
            },
        },
        clock: true,
    });
    root.appendChild(taskbar);

    // Handle browser close/refresh
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        event.preventDefault();
        event.returnValue = "";
    };

    const handleUnload = () => {
        cleanup();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleUnload);
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
    
    if (state1 === "win") p1.classList.add("font-bold");
    if (state1 === "loss") p1.classList.add("line-through");

    const p2 = document.createElement("div");
    p2.textContent = player2 || "Winner of Semifinal";
    p2.classList.add("slot", state2, "text-center", "w-full", "p-1", player2 ? "bg-gray-500" : "text-gray-500");
    
    if (state2 === "win") p2.classList.add("font-bold");
    if (state2 === "loss") p2.classList.add("line-through");

    match.appendChild(p1);
    match.appendChild(p2);

    return match;
}

