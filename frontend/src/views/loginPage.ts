export function loginView() {
    const root = document.getElementById("app")!;
    root.innerHTML = "";

    const container = document.createElement("div");
    container.className = "login-container";

    const header = document.createElement("div");
    header.className = "login-header";
    header.innerHTML = "<h1>Login</h1>";

    container.appendChild(header);
    root.appendChild(container);
}
