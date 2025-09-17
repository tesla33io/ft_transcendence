export function friendsView() {
    const root = document.getElementById("app")!;
    root.innerHTML = "";

    const container = document.createElement("div");
    container.className = "friends-container";

    const header = document.createElement("div");
    header.className = "friends-header";
    header.innerHTML = "<h1>Friends</h1>";

    container.appendChild(header);
    root.appendChild(container);
}
