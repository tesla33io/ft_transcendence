import { Router } from '../router';
import { createWindow } from './components';
import { PongGame } from '../game/PongGame';

export function remoteGameSetupView(router: Router) {
    const root = document.getElementById("app")!;
    root.innerHTML = "";

    const content = document.createElement("div");

    // Player Statistics Section
    const statsSection = document.createElement("div");
    statsSection.className = "stats-section mb-4 p-3 border border-gray-300";
    statsSection.style.backgroundColor = "#f5f5f5";

    const statsTitle = document.createElement("h3");
    statsTitle.textContent = "Player Statistics";
    statsTitle.className = "text-sm font-bold mb-2";

    // Placeholder values - replace with backend data later
    const currentRating = 1000; // TODO: Get from backend
    const highestRating = 1000; // TODO: Get from backend  
    const ratingChange = 0; // TODO: Get from backend

    const currentRatingDiv = document.createElement("div");
    currentRatingDiv.className = "flex justify-between text-xs mb-1";
    currentRatingDiv.innerHTML = `
        <span>Current Rating:</span>
        <span class="font-semibold">${currentRating}</span>
    `;

    const highestRatingDiv = document.createElement("div");
    highestRatingDiv.className = "flex justify-between text-xs mb-1";
    highestRatingDiv.innerHTML = `
        <span>Highest Rating:</span>
        <span class="font-semibold text-blue-600">${highestRating}</span>
    `;

    const ratingChangeDiv = document.createElement("div");
    ratingChangeDiv.className = "flex justify-between text-xs";
    const changeColor = ratingChange > 0 ? "text-green-600" : ratingChange < 0 ? "text-red-600" : "text-gray-600";
    const changeSymbol = ratingChange > 0 ? "+" : "";
    ratingChangeDiv.innerHTML = `
        <span>Recent +/-::</span>
        <span class="font-semibold ${changeColor}">${changeSymbol}${ratingChange}</span>
    `;

    statsSection.appendChild(statsTitle);
    statsSection.appendChild(currentRatingDiv);
    statsSection.appendChild(highestRatingDiv);
    statsSection.appendChild(ratingChangeDiv);
    content.appendChild(statsSection);

    const form = document.createElement("form");
    form.id = "joinOnlineGameForm";
    form.className = "join-game-form";

    const label = document.createElement("label");
    label.htmlFor = "playerName";
    label.textContent = "Player Name";

    const input = document.createElement("input");
    input.type = "text";
    input.id = "playerName";
    input.name = "playerName";
    input.placeholder = "Enter your name ";
    input.minLength = 1;
    input.maxLength = 20;
    input.required = true;

    const joinClassicBtn = document.createElement("button");
    joinClassicBtn.type = "submit";
    joinClassicBtn.id = "joinBtn";
    joinClassicBtn.textContent = "Join Online Game";

    form.append(label, input, joinClassicBtn);
    content.appendChild(form);

    // Canvas (hidden until game starts)
    const canvas = document.createElement("canvas");
    canvas.id = "gameCanvas";
    canvas.width = 900;
    canvas.height = 500;
    canvas.style.display = "none";
    content.appendChild(canvas);

    // Loading, error, success messages
    const loading = document.createElement("div");
    loading.id = "loading";
    loading.className = "loading";
    loading.textContent = "Loading...";
    loading.style.display = "none";
    content.appendChild(loading);

    const errorMessage = document.createElement("div");
    errorMessage.id = "errorMessage";
    errorMessage.className = "error-message";
    errorMessage.style.display = "none";
    content.appendChild(errorMessage);

    const successMessage = document.createElement("div");
    successMessage.id = "successMessage";
    successMessage.className = "success-message";
    successMessage.style.display = "none";
    content.appendChild(successMessage);

    const setupWindow = createWindow({
        title: "Online Game Setup",
        width: "450px", // Made slightly wider for stats
        content: content,
        titleBarControls: {
            help: true,
            close: true,
            onClose: () => {
                router.navigate("/desktop");
            }
        }
    });

    root.appendChild(setupWindow);

    form.addEventListener("submit", async (e: Event) => {
        e.preventDefault();
        const playerName = input.value.trim();
        if (!playerName) return;

        joinClassicBtn.disabled = true;
        joinClassicBtn.textContent = "Waiting for opponent...";
        loading.style.display = "block";
        errorMessage.style.display = "none";
        successMessage.style.display = "none";

        // Generate a cryptographically secure playerId
        const playerId = crypto.getRandomValues(new Uint8Array(8)).reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

        try {
            const game = new PongGame(
                playerName,
                playerId,
                'classic',
                router
            );
            await game.joinGame();
        } catch (error) {
            console.error("Failed to join game:", error);
            errorMessage.textContent = "Failed to join game";
            errorMessage.style.display = "block";
            joinClassicBtn.disabled = false;
            joinClassicBtn.textContent = "Join Online Game";
            loading.style.display = "none";
        }
    });
}