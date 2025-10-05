import { Router } from '../router';
import { createWindow } from './components';
import { PongGame } from '../game/PongGame';

export function remoteGameSetupView(router: Router) {
    const root = document.getElementById("app")!;
    root.innerHTML = "";

    // --- Window Content ---
    const content = document.createElement("div");

    // Form
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
        width: "400px",
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

    // --- Form Submit Handler ---
    form.addEventListener("submit", async (e: Event) => {
        e.preventDefault();
        const playerName = input.value.trim();
        if (!playerName) return;

        joinClassicBtn.disabled = true;
        joinClassicBtn.textContent = "Waiting for opponent...";
        loading.style.display = "block";
        errorMessage.style.display = "none";
        successMessage.style.display = "none";

        // Generate a random playerId for testing later switch with the values from backend
        const playerId = Math.random().toString().substring(2, 7);

        try {
            const game = new PongGame(
                playerName,
                playerId,
                'classic',
                canvas,
                router
            );
            await game.joinGame(playerName); // You can stub this for testing
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