import { PongGame } from "../game/PongGame";
import {Router} from "../router"
import { createWindow } from "./components";

export function testingPage(router: Router) {
    const root = document.getElementById("app")!;
    root.innerHTML = "";

    // --- content for window body ---
    const content = document.createElement("div");

    // Form
    const form = document.createElement("form");
    form.id = "joinGameForm";
    form.className = "joinGameForm";

    const formGroup = document.createElement("div");
    formGroup.className = "form-group";

    const label = document.createElement("label");
    label.htmlFor = "playerName";
    label.textContent = "Player Name";

    const input = document.createElement("input");
    input.type = "text";
    input.id = "playerName";
    input.name = "playerName";
    input.placeholder = "Enter your name";
    input.minLength = 1;
    input.maxLength = 20;
    input.required = true;

    const joinBtn = document.createElement("button");
    joinBtn.type = "submit";
    joinBtn.id = "joinBtn";
    joinBtn.textContent = "Join Game";

    formGroup.append(label, input);
    form.append(formGroup, joinBtn);
    content.appendChild(form);

    // Canvas
    const canvas = document.createElement("canvas");
    canvas.id = "gameCanvas";
    canvas.width = 900;
    canvas.height = 500;
    content.appendChild(canvas);

    // Loading
    const loading = document.createElement("div");
    loading.id = "loading";
    loading.className = "loading";
    loading.textContent = "Loading...";
    loading.style.display = "none";
    content.appendChild(loading);

    // Error and success messages
    const errorMessage = document.createElement("div");
    errorMessage.id = "errorMessage";
    errorMessage.className = "error-message";
    errorMessage.style.display = "none";

    const successMessage = document.createElement("div");
    successMessage.id = "successMessage";
    successMessage.className = "success-message";
    successMessage.style.display = "none";

    content.append(errorMessage, successMessage);

    // --- create window ---
    const testWindow = createWindow({
        title: "Pong Game",
        width: "600px",
        content: content,
        titleBarControls: {
            close: true,
            onClose: () => {
                router.navigate("/desktop");
            }
        }
    });

    root.append(testWindow);

    // --- form submit handler ---
    form.addEventListener("submit", async (e: Event) => {
        e.preventDefault();
        const playerName = input.value.trim();
        if (!playerName) return;

        joinBtn.disabled = true;
        joinBtn.textContent = "Waiting for opponent...";
        loading.style.display = "block";
        errorMessage.style.display = "none";
        successMessage.style.display = "none";

        try {
            const game = new PongGame(
                form,
                input,
                joinBtn,
                loading,
                errorMessage,
                successMessage,
                canvas,
                router
            );
            await game.joinGame(playerName);
        } catch (error) {
            console.error("Failed to join game:", error);
            errorMessage.textContent = "Failed to join game";
            errorMessage.style.display = "block";

            // reset button
            joinBtn.disabled = false;
            joinBtn.textContent = "Join Game";
            loading.style.display = "none";
        }
    });
}
