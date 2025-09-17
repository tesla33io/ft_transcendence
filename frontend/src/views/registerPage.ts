export function registerView() {
    const root = document.getElementById("app")!;
    root.innerHTML = "";

    const container = document.createElement("div");
    container.className = "register-container";

    const header = document.createElement("div");
    header.className = "register-header";
    header.innerHTML = "<h1>Register</h1>";

    container.appendChild(header);
    root.appendChild(container);
}
