// src/pages/GamePage.ts
import { PongGame } from "../game/PongGame";

export function testingPage() {
	const root = document.getElementById("app")!;

    root.innerHTML = ""; // clear existing content

    // Container
    const container = document.createElement("div");
    container.className = "container";

    // Logo
    const logo = document.createElement("div");
    logo.className = "logo";
    logo.textContent = "PONG";
    container.appendChild(logo);

    // Subtitle
    const subtitle = document.createElement("div");
    subtitle.className = "subtitle";
    subtitle.textContent = "ft_transcendence";
    container.appendChild(subtitle);

    // Game Canvas
    const gameContainer = document.createElement("div");
    gameContainer.id = "gameContainer";

    const canvas = document.createElement("canvas");
    canvas.id = "gameCanvas";
    canvas.width = 900;
    canvas.height = 550;
    gameContainer.appendChild(canvas);
    container.appendChild(gameContainer);

    // Result screen
    const resultScreen = document.createElement("div");
    resultScreen.id = "result-screen";
    resultScreen.className = "hidden";

    const resultContent = document.createElement("div");
    resultContent.className = "result-content";

    const resultTitle = document.createElement("h1");
    resultTitle.id = "result-title";
    resultTitle.textContent = "You Win!";

    const resultScore = document.createElement("p");
    resultScore.id = "result-score";
    resultScore.textContent = "0 : 0";

    const playAgainBtn = document.createElement("button");
    playAgainBtn.id = "play-again-btn";
    playAgainBtn.textContent = "Play Again";

    resultContent.append(resultTitle, resultScore, playAgainBtn);
    resultScreen.appendChild(resultContent);
    container.appendChild(resultScreen);

    // Form
    const form = document.createElement("form");
    form.id = "joinGameForm";

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
    joinBtn.className = "join-btn";
    joinBtn.id = "joinBtn";
    joinBtn.textContent = "Join Game";

    formGroup.append(label, input);
    form.appendChild(formGroup);
    form.appendChild(joinBtn);
    container.appendChild(form);

    // Loading
    const loading = document.createElement("div");
    loading.id = "loading";
    loading.className = "loading";

    const spinner = document.createElement("div");
    spinner.className = "spinner";

    const loadingText = document.createElement("p");
    loadingText.textContent = "Joining game...";

    loading.append(spinner, loadingText);
    container.appendChild(loading);

    // Error and success messages
    const errorMessage = document.createElement("div");
    errorMessage.id = "errorMessage";
    errorMessage.className = "error-message";

    const successMessage = document.createElement("div");
    successMessage.id = "successMessage";
    successMessage.className = "success-message";

    container.append(errorMessage, successMessage);

    // Dev log
    const devLog = document.createElement("div");
    devLog.id = "devLogOutput";
    devLog.setAttribute("role", "log");
    devLog.setAttribute("aria-live", "polite");
    container.appendChild(devLog);

    // Append everything to root
    root.appendChild(container);

     new PongGame(
        form,
        input,
        joinBtn,
        loading,
        errorMessage,
        successMessage,
        canvas
    );
}



