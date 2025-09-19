import { PongGame } from "../game/PongGame";
import {Router} from "../router"

export function testingPage(router: Router) {
	     const root = document.getElementById("app")!;
    root.innerHTML = "";

    // Create main window
    const mainWindow = document.createElement("div");
    mainWindow.className = "window main-window";

    // Create title bar
    const titleBar = document.createElement("div");
    titleBar.className = "title-bar";

    const titleText = document.createElement("div");
    titleText.className = "title-bar-text";
    titleText.textContent = "ft_transcendence - Pong";

    titleBar.appendChild(titleText);
    mainWindow.appendChild(titleBar);

    // Create window body
    const windowBody = document.createElement("div");
    windowBody.className = "window-body";

    // Create tab menu
    const tabMenu = document.createElement("menu");
    tabMenu.setAttribute("role", "tablist");

    const tabs = [
		{ name: "Test Site", route: "/test" },
        { name: "Homepage", route: "/homepage" },
        { name: "Profile", route: "/profile" },
        { name: "Friends", route: "/friends" },
        { name: "Tournament", route: "/tournament" }
    ];

    // Create tabs
    tabs.forEach((tab, index) => {
        const li = document.createElement("li");
        li.setAttribute("role", "tab");
        if (index === 0) {
            li.setAttribute("aria-selected", "true");
        }

        const a = document.createElement("a");
        a.href = "#";
        a.textContent = tab.name;
        a.onclick = (e) => {
            e.preventDefault();
            // Update selected tab
            tabMenu.querySelectorAll('[role="tab"]').forEach(tab =>
                tab.removeAttribute('aria-selected'));
            li.setAttribute('aria-selected', 'true');
            router.navigate(tab.route);
        };

        li.appendChild(a);
        tabMenu.appendChild(li);
    });

    // Create content area
    const tabContent = document.createElement("div");
    tabContent.className = "tab-content";



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

	const canvas = document.createElement("canvas");
    canvas.id = "gameCanvas";
    canvas.width = 900;
    canvas.height = 550;

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

	root.appendChild(container);

    form.addEventListener("submit", async (e: Event) => {
        e.preventDefault();
        const playerName = input.value.trim();
        if (!playerName) return;

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
            console.error('Failed to join game:', error);
            errorMessage.textContent = 'Failed to join game';
            errorMessage.style.display = 'block';
        }
    });

	 // Assemble the components
	tabContent.appendChild(container);
    windowBody.appendChild(tabMenu);
    windowBody.appendChild(tabContent);
    mainWindow.appendChild(windowBody);
    root.appendChild(mainWindow);





}
