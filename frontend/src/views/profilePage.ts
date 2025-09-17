export function profileView() {
    const root = document.getElementById("app")!;
    root.innerHTML = "";

    const container = document.createElement("div");
    container.className = "profile-container";

    const header = document.createElement("div");
    header.className = "profile-header";
    header.innerHTML = "<h1>Profile</h1>";

    container.appendChild(header);
    root.appendChild(container);
}
