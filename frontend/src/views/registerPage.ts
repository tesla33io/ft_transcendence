import { Router } from "../router";
import { createWindow } from "./components";
import agent from "./images/msagent.png"
import book_user from "./images/book_user.png"
import rabit from "./images/rabit.png"
// ----------------------------
// Registration Page View
// ----------------------------
export function registerView(router: Router) {
    const root = document.getElementById("app")!;
    root.innerHTML = "";

    const content = document.createElement("div");

    // ----------------------------
    // Registration form (without register button here, we'll add it later at the bottom)
    // ----------------------------
    content.innerHTML = `
        <p></p>

        <div class="field-row-stacked" style="width: 200px">
            <label for="username">Enter Username</label>
            <input id="username" type="text" />
            <label for="email">Enter Email</label>
            <input id="email" type="text" />
        </div>
        <div class="field-row-stacked" style="width: 200px">
            <label for="password">Enter Password</label>
            <input id="password" type="password" />
        </div>
        <div class="field-row-stacked" style="width: 200px">
            <label for="repeat_password">Repeat Password</label>
            <input id="repeat_password" type="password" />
        </div>
            
        <div class="twofactor">
            <label>Enable 2Factor authentication</label>
            <div class="field-row">
                <input id="2factor_yes" type="radio" name="twofactor" value="yes">
                <label for="2factor_yes">Yes</label>
            </div>
            <div class="field-row">
                <input id="2factor_no" type="radio" name="twofactor" value="no" checked>
                <label for="2factor_no">No</label>
            </div>
        </div>
        <div class="profileBio">
            <div class="field-row-stacked" style="width: 200px">
                <label for="profileBio">Add a Bio to your Profile</label>
                <textarea id="profileBio" rows="4"></textarea>
            </div>
        </div>
    `;

    // ----------------------------
    // Avatar selection section
    // ----------------------------
    const avatarSection = document.createElement("div");
    avatarSection.innerHTML = `<label>Choose an Avatar</label>`;
    avatarSection.style.marginTop = "10px";

    const avatarContainer = document.createElement("div");
    avatarContainer.style.display = "flex";
    avatarContainer.style.gap = "10px";

    const avatars = [agent, book_user, rabit];
    avatars.forEach(src => {
        const img = document.createElement("img");
        img.src = src;
        img.width = 50;
        img.height = 50;
        img.style.cursor = "pointer";
        img.classList.add("avatar-option");

        img.addEventListener("click", () => {
            // remove old selection
            avatarContainer.querySelectorAll(".avatar-option").forEach(a => a.classList.remove("selected"));
            // add new selection
            img.classList.add("selected");
            avatarInput.value = src;
        });

        avatarContainer.appendChild(img);
    });

    const avatarInput = document.createElement("input");
    avatarInput.type = "hidden";
    avatarInput.id = "avatar";

    avatarSection.appendChild(avatarContainer);
    avatarSection.appendChild(avatarInput);

    // Upload custom avatar
    const uploadLabel = document.createElement("label");
    uploadLabel.textContent = "Or upload custom avatar:";
    uploadLabel.style.display = "block";
    uploadLabel.style.marginTop = "10px";

    const uploadInput = document.createElement("input");
    uploadInput.type = "file";
    uploadInput.accept = "image/*";

    uploadInput.addEventListener("change", () => {
        const file = uploadInput.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                avatarInput.value = e.target!.result as string;
            };
             avatarContainer.querySelectorAll(".avatar-option")
                    .forEach(a => a.classList.remove("selected"));
            reader.readAsDataURL(file);
        }
    });

    avatarSection.appendChild(uploadLabel);
    avatarSection.appendChild(uploadInput);

    // Append avatar section
    content.appendChild(avatarSection);

    // ----------------------------
    // Register button 
    // ----------------------------
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "field-row";
    buttonContainer.style.marginTop = "15px";

    const registerBtn = document.createElement("button");
    registerBtn.id = "registerBtn";
    registerBtn.textContent = "Register";

    buttonContainer.appendChild(registerBtn);
    content.appendChild(buttonContainer);

    // ----------------------------
    // Create window
    // ----------------------------
    const simpleWindow = createWindow({
        title: "Register New Account",
        width: "400px",
        content: content,
        titleBarControls: {
            help: true,
            close: true,
            onClose: () => router.navigate("/login")
        }
    });

    // ----------------------------
    // Collect data
    // ----------------------------
    function getRegistrationData() {
        const username = (content.querySelector<HTMLInputElement>("#username")!).value;
        const email = (content.querySelector<HTMLInputElement>("#email")!).value;
        const password = (content.querySelector<HTMLInputElement>("#password")!).value;
        const repeatPassword = (content.querySelector<HTMLInputElement>("#repeat_password")!).value;

        // FIX: get selected 2FA option properly
        const twoFactor = (content.querySelector<HTMLInputElement>('input[name="twofactor"]:checked')!)?.value === "yes";

        const bio = (content.querySelector<HTMLTextAreaElement>("#profileBio")!).value;
        const avatar = (content.querySelector<HTMLInputElement>("#avatar")!).value;

        return { username, email, password, repeatPassword, twoFactor, bio, avatar };
    }

    // ----------------------------
    // Register logic
    // ----------------------------
    registerBtn.addEventListener("click", () => {
        const data = getRegistrationData();
        console.log("Prepared registration data:", data);

        // TODO: send to backend
        router.navigate("/desktop");
    });

    
    root.append(simpleWindow);


}