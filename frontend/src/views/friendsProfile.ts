import { Router } from "../router";

export function friendsProfileView(router: Router) {
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
        { name: "Homepage", route: "/homepage" },
        { name: "Test Site", route: "/test" },
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
    tabContent.innerHTML = "<p>Friends page</p>";

    // Assemble the components
    windowBody.appendChild(tabMenu);
    windowBody.appendChild(tabContent);
    mainWindow.appendChild(windowBody);
    root.appendChild(mainWindow);
}
