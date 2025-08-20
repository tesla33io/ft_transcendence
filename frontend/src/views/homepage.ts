import { Router } from "../router";

export function HomePage(router: Router) {
    const root = document.getElementById("app")!;
    root.innerHTML = "";

    const container = document.createElement("div");
    container.className = "home-page";

    const title = document.createElement("h1");
    title.textContent = "ft_transcendence - Pong";
    container.appendChild(title);

    const quickMatchBtn = document.createElement("button");
    quickMatchBtn.textContent = "testing page";
	quickMatchBtn.id = "testingSitebutton";
    quickMatchBtn.onclick = () => {
        // navigate to PongGame page
        router.navigate("/testingSite");
    };
    container.appendChild(quickMatchBtn);

    root.appendChild(container);
}
