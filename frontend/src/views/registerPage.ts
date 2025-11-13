import { Router } from "../router";
import { createWindow } from "../components/_components";
import { createTaskbar } from "../components/_components";
import { UserService } from "../game/userService";
import type { RegisterRequest } from "../types";
import { AVATAR_PRESETS, DEFAULT_AVATAR_ID } from "../game/avatarConstants"; 
// ----------------------------
// Registration Page View
// ----------------------------
export function registerView(router: Router) {
    const root = document.getElementById("app")!;
    root.innerHTML = "";

    const content = document.createElement("div");

    // ----------------------------
    // Registration form 
    // ----------------------------
    content.innerHTML = `
        <p></p>

        <div class="field-row-stacked" style="width: 240px">
            <label for="username">Enter Username</label>
            <input id="username" type="text" />
        </div>
        <div class="field-row-stacked" style="width: 240px"> 
            <label for="password">Enter Password</label>
            <input id="password" type="password" />
        </div>
        <div class="field-row-stacked" style="width: 240px">
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
    `;

    // ----------------------------
    // Avatar selection section (SIMPLIFIED)
    // ----------------------------
    const avatarSection = document.createElement("div");
    avatarSection.innerHTML = `<label>Choose an Avatar</label>`;
    avatarSection.style.cssText = `
        margin-top: 10px;
        width: 240px;
        text-align: center;
    `;

    const avatarContainer = document.createElement("div");
    avatarContainer.style.cssText = `
        display: flex;
        gap: 12px;
        margin-top: 8px;
        justify-content: center;
        flex-wrap: wrap;
    `; 

    const avatarInput = document.createElement("input");
    avatarInput.type = "hidden";
    avatarInput.id = "avatar";
    avatarInput.value = DEFAULT_AVATAR_ID; 

    AVATAR_PRESETS.forEach((avatar) => {
        const avatarWrapper = document.createElement("div");
        avatarWrapper.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            cursor: pointer;
        `;

        const img = document.createElement("img");
        img.src = avatar.src;
        img.width = 50; 
        img.height = 50;
        img.style.cssText = `
            border: 3px solid transparent;
            border-radius: 4px;
            transition: border-color 0.2s;
        `;
        img.classList.add("avatar-option");
        img.dataset.avatarId = avatar.id;

        if (avatar.id === DEFAULT_AVATAR_ID) {
            img.style.borderColor = "#0000ff";
            img.classList.add("selected");
        }

        const label = document.createElement("span");
        label.textContent = avatar.name;
        label.style.cssText = `
            font-size: 10px;
            color: #333;
        `;

        avatarWrapper.addEventListener("click", () => {
            // Remove old selection
            avatarContainer.querySelectorAll(".avatar-option").forEach(a => {
                (a as HTMLElement).style.borderColor = "transparent";
                a.classList.remove("selected");
            });
            
            // Add new selection
            img.style.borderColor = "#0000ff";
            img.classList.add("selected");
            avatarInput.value = avatar.id;
        });

        avatarWrapper.appendChild(img);
        avatarWrapper.appendChild(label);
        avatarContainer.appendChild(avatarWrapper);
    });

    avatarSection.appendChild(avatarContainer);
    avatarSection.appendChild(avatarInput);

    // Append avatar section
    content.appendChild(avatarSection);

    // ----------------------------
    // Error and Loading messages
    // ----------------------------
    const errorMessage = document.createElement("div");
    errorMessage.style.color = "red";
    errorMessage.style.textAlign = "center";
    errorMessage.style.marginTop = "10px";
    errorMessage.style.display = "none";
    content.appendChild(errorMessage);

    const loadingMessage = document.createElement("div");
    loadingMessage.textContent = "Creating account...";
    loadingMessage.style.textAlign = "center";
    loadingMessage.style.marginTop = "10px";
    loadingMessage.style.display = "none";
    content.appendChild(loadingMessage);

    // ----------------------------
    // Register button 
    // ----------------------------
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "field-row";
    buttonContainer.style.marginTop = "15px";
    buttonContainer.style.gap = "10px";

    const registerBtn = document.createElement("button");
    registerBtn.id = "registerBtn";
    registerBtn.textContent = "Register";

    const cancelBtn = document.createElement("button");
    cancelBtn.id = "cancelBtn";
    cancelBtn.textContent = "Cancel";

    buttonContainer.appendChild(registerBtn);
    buttonContainer.appendChild(cancelBtn);
    content.appendChild(buttonContainer);

    // Create window
    const simpleWindow = createWindow({
        title: "Register New Account",
        width: "280px",
        height: "400px",
        initialPosition: {x: 500 , y: 200},
        content: content,
        titleBarControls: {
            help: true,
            close: true,
            onClose: () => router.navigate("/login")
        }
    });

    // Helper functions
    function showError(message: string) {
        errorMessage.textContent = message;
        errorMessage.style.display = "block";
        loadingMessage.style.display = "none";
    }

    function showLoading() {
        loadingMessage.style.display = "block";
        errorMessage.style.display = "none";
        registerBtn.disabled = true;
        registerBtn.textContent = "Creating account...";
    }

    function hideLoading() {
        loadingMessage.style.display = "none";
        registerBtn.disabled = false;
        registerBtn.textContent = "Register";
    }

    function getRegistrationData() {
        const username = (content.querySelector<HTMLInputElement>("#username")!).value.trim();
        const password = (content.querySelector<HTMLInputElement>("#password")!).value;
        const repeatPassword = (content.querySelector<HTMLInputElement>("#repeat_password")!).value;
        const twoFactor = (content.querySelector<HTMLInputElement>('input[name="twofactor"]:checked')!)?.value === "yes";
        const avatarId = (content.querySelector<HTMLInputElement>("#avatar")!).value; // ✅ Get avatar ID

        return { username, password, repeatPassword, twoFactor, avatarId };
    }

    function validateRegistrationData(data: ReturnType<typeof getRegistrationData>): string | null {
        if (!data.username) return "Username is required";
        if (data.username.length < 3) return "Username must be at least 3 characters";
        if (data.username.length > 30) return "Username must be less than 30 characters";
        
        if (!data.password) return "Password is required";
        if (data.password.length < 6) return "Password must be at least 6 characters";
        
        if (data.password !== data.repeatPassword) return "Passwords don't match";

        return null;
    }

    async function handleRegistration() {
        const data = getRegistrationData();
        
        const validationError = validateRegistrationData(data);
        if (validationError) {
            showError(validationError);
            return;
        }

        showLoading();

        try {
            // ✅ Send avatar ID to backend
            const registerData: RegisterRequest = {
                username: data.username,
                password: data.password,
                avatarUrl: data.avatarId, 
                twoFactorEnabled: data.twoFactor
            };

            console.log("📤 Sending registration request:", {
                username: registerData.username,
                twoFactorEnabled: registerData.twoFactorEnabled,
                avatarId: registerData.avatarUrl
            });

            const authResponse = await UserService.register(registerData);

            console.log('✅ Registered New User:', authResponse.user.username);
            console.log('✅ User ID:', authResponse.user.id);

            router.navigate("/desktop");

        } catch (error) {
            console.error('❌ Registration failed:', error);
            hideLoading();
            showError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
        }
    }

    // Event listeners
    registerBtn.addEventListener("click", handleRegistration);
    cancelBtn.addEventListener("click", () => router.navigate("/login"));

    const handleEnterKey = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleRegistration();
        }
    };
    
    content.querySelector<HTMLInputElement>("#username")?.addEventListener('keypress', handleEnterKey);
    content.querySelector<HTMLInputElement>("#password")?.addEventListener('keypress', handleEnterKey);
    content.querySelector<HTMLInputElement>("#repeat_password")?.addEventListener('keypress', handleEnterKey);

    root.append(simpleWindow);

    const { taskbar } = createTaskbar({
        clock: true,
        router: router
    });
    root.appendChild(taskbar);

    setTimeout(() => {
        content.querySelector<HTMLInputElement>("#username")?.focus();
    }, 100);
}