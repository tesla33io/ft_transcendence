export function tournamentView() {
    const root = document.getElementById("app")!;
    root.innerHTML = "";

    const container = document.createElement("div");
    container.className = "tournament-container";

    const header = document.createElement("div");
    header.className = "tournament-header";
    header.innerHTML = "<h1>Tournaments</h1>";

    container.appendChild(header);
    root.appendChild(container);
}
