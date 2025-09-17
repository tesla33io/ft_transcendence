export function friendsProfileView() {
    const root = document.getElementById("app")!;
    root.innerHTML = "";

    const container = document.createElement("div");
    container.className = "friends-profile-container";

    const header = document.createElement("div");
    header.className = "friends-profile-header";
    header.innerHTML = "<h1>Friend's Profile</h1>";

    container.appendChild(header);
    root.appendChild(container);
}
