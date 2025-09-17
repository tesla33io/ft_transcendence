export function tournamentRoomView() {
    const root = document.getElementById("app")!;
    root.innerHTML = "";

    const container = document.createElement("div");
    container.className = "tournament-room-container";

    const header = document.createElement("div");
    header.className = "tournament-room-header";
    header.innerHTML = "<h1>Tournament Room</h1>";

    container.appendChild(header);
    root.appendChild(container);
}
