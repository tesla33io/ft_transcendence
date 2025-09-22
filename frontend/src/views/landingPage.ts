import { Router } from "../router";

export function landingView(){
	const root = document.getElementById("app")!;
    root.innerHTML = "";

	const Desktop = document.createElement("div");
	Desktop.className = "Desktop";

	// Outer window
    const windowDiv = document.createElement("div");
    windowDiv.className = "window";
    windowDiv.style.width = "300px";

    // Title bar
    const titleBar = document.createElement("div");
    titleBar.className = "title-bar";

    const titleBarText = document.createElement("div");
    titleBarText.className = "title-bar-text";
    titleBarText.textContent = "Welcome to Transcendence";

    const titleBarControls = document.createElement("div");
    titleBarControls.className = "title-bar-controls";

    // Buttons
    const btnMin = document.createElement("button");
    btnMin.setAttribute("aria-label", "Minimize");

    const btnMax = document.createElement("button");
    btnMax.setAttribute("aria-label", "Maximize");

    const btnClose = document.createElement("button");
    btnClose.setAttribute("aria-label", "Close");

    // Append buttons
    titleBarControls.appendChild(btnMin);
    titleBarControls.appendChild(btnMax);
    titleBarControls.appendChild(btnClose);

    // Append title bar parts
    titleBar.appendChild(titleBarText);
    titleBar.appendChild(titleBarControls);

    // Window body
    const windowBody = document.createElement("div");
    windowBody.className = "window-body";

    const p = document.createElement("p");
    p.textContent = "Weclome";

    windowBody.appendChild(p);

    // Build window
    windowDiv.appendChild(titleBar);
    windowDiv.appendChild(windowBody);

    // Add to root
    root.appendChild(windowDiv);




}
