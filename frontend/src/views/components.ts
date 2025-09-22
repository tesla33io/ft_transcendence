interface WindowOptions {
    title: string;
    width?: string;
    height?: string;
    content?: HTMLElement;
    initialPosition?: { x: number; y: number };
    titleBarControls?: {
        minimize?: boolean;
        maximize?: boolean;
        close?: boolean;
        help?: boolean;
        onMinimize?: () => void;
        onMaximize?: () => void;
        onClose?: () => void;
        onHelp?: () => void;
    };
    isMaximized?: boolean;
}

export function createWindow(options: WindowOptions): HTMLElement {
    const windowDiv = document.createElement("div");
    windowDiv.className = "window";
    if (options.width) windowDiv.style.width = options.width;
    if (options.height) windowDiv.style.height = options.height;

    // Position setup
    windowDiv.style.position = "absolute";
    windowDiv.style.left = `${options.initialPosition?.x || 50}px`;
    windowDiv.style.top = `${options.initialPosition?.y || 50}px`;

    // Title bar
    const titleBar = document.createElement("div");
    titleBar.className = "title-bar";

    const titleBarText = document.createElement("div");
    titleBarText.className = "title-bar-text";
    titleBarText.textContent = options.title;

    const titleBarControls = document.createElement("div");
    titleBarControls.className = "title-bar-controls";

    // Add controls based on options
    if (options.titleBarControls) {
        if (options.titleBarControls.minimize) {
            const btnMin = document.createElement("button");
            btnMin.setAttribute("aria-label", "Minimize");
            btnMin.onclick = options.titleBarControls.onMinimize || (() => {});
            titleBarControls.appendChild(btnMin);
        }

        if (options.titleBarControls.maximize) {
            const btnMax = document.createElement("button");
            btnMax.setAttribute("aria-label", options.isMaximized ? "Restore" : "Maximize");
            btnMax.onclick = options.titleBarControls.onMaximize || (() => {});
            titleBarControls.appendChild(btnMax);
        }

        if (options.titleBarControls.help) {
            const btnHelp = document.createElement("button");
            btnHelp.setAttribute("aria-label", "Help");
            btnHelp.onclick = options.titleBarControls.onHelp || (() => {});
            titleBarControls.appendChild(btnHelp);
        }

        if (options.titleBarControls.close) {
            const btnClose = document.createElement("button");
            btnClose.setAttribute("aria-label", "Close");
            btnClose.onclick = () => {
                if (options.titleBarControls?.onClose) {
                    options.titleBarControls.onClose();
                }
                windowDiv.remove();
            };
            titleBarControls.appendChild(btnClose);
        }
		titleBar.appendChild(titleBarText);
		titleBar.appendChild(titleBarControls);
    }


    // Create window body
    const windowBody = document.createElement("div");
    windowBody.className = "window-body";

    // Add content if provided
    if (options.content) {
        windowBody.appendChild(options.content);
    }

    // Make window draggable
    let isDragging = false;
    let currentX: number;
    let currentY: number;
    let initialX: number;
    let initialY: number;

    titleBar.addEventListener("mousedown", (e) => {
        isDragging = true;
        initialX = e.clientX - windowDiv.offsetLeft;
        initialY = e.clientY - windowDiv.offsetTop;
    });

    document.addEventListener("mousemove", (e) => {
        if (isDragging) {
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            windowDiv.style.left = `${currentX}px`;
            windowDiv.style.top = `${currentY}px`;
        }
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
    });

    // Assemble window
    windowDiv.append(titleBar, windowBody);

    return windowDiv;
}
