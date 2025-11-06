import { Router } from "../router";
import { createWindow } from "../components/_components";
import { createTaskbar } from "../components/_components";
import { UserService } from "../game/userService";
import type { RegisterRequest } from "../types";
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
    // Registration form 
    // ----------------------------
    content.innerHTML = `
        <p></p>

        <div class="field-row-stacked" style="width: 240px">
            <label for="username">Enter Username</label>
            <input id="username" type="text" />
            <label for="email">Enter Email</label>
            <input id="email" type="text" />
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
        <div class="profileBio">
            <div class="field-row-stacked" style="width: 240px"> 
                <label for="profileBio">Add a Bio to your Profile</label>
                <textarea id="profileBio" rows="3"></textarea> 
            </div>
        </div>
    `;

    // ----------------------------
    // Avatar selection section
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
        gap: 8px;
        margin-bottom: 8px;
        justify-content: center;
        flex-wrap: wrap;
    `; 

    const avatars = [agent, book_user, rabit];
    
    avatars.forEach(src => {
        const img = document.createElement("img");
        img.src = src;
        img.width = 45; 
        img.height = 45;
        img.style.cursor = "pointer";
        img.style.border = "2px solid transparent";
        img.classList.add("avatar-option");

        img.addEventListener("click", () => {
            // Remove old selection
            avatarContainer.querySelectorAll(".avatar-option").forEach(a => {
                (a as HTMLElement).style.border = "2px solid transparent";
                a.classList.remove("selected");
            });
            // Add new selection
            img.style.border = "2px solid #0000ff";
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

    
    const uploadSection = createAvatarUpload(avatarInput, avatarContainer);
    avatarSection.appendChild(uploadSection);

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

    // Collect and validate data
    function getRegistrationData() {
        const username = (content.querySelector<HTMLInputElement>("#username")!).value.trim();
        const password = (content.querySelector<HTMLInputElement>("#password")!).value;
        const repeatPassword = (content.querySelector<HTMLInputElement>("#repeat_password")!).value;
        const twoFactor = (content.querySelector<HTMLInputElement>('input[name="twofactor"]:checked')!)?.value === "yes";
        const bio = (content.querySelector<HTMLTextAreaElement>("#profileBio")!).value.trim();
        const avatar = (content.querySelector<HTMLInputElement>("#avatar")!).value;

        return { username, password, repeatPassword, twoFactor, bio, avatar };
    }

    function validateRegistrationData(data: ReturnType<typeof getRegistrationData>): string | null {
        // Basic validation
        /* commented out for testing porpose
        if (!data.username) return "Username is required";
        if (data.username.length < 3) return "Username must be at least 3 characters";
        if (data.username.length > 30) return "Username must be less than 30 characters";
        
        if (!data.email) return "Email is required";
        if (!data.email.includes('@')) return "Please enter a valid email";
        
        if (!data.password) return "Password is required";
        if (data.password.length < 6) return "Password must be at least 6 characters";
        
        if (data.password !== data.repeatPassword) return "Passwords don't match";
        */
        return null; // No errors
    }

    async function handleRegistration() {
        const data = getRegistrationData();
        // Validate data
        const validationError = validateRegistrationData(data);
        if (validationError) {
            showError(validationError);
            return;
        }
        showLoading();
        try {
            // Create RegisterRequest object 
            const registerData: RegisterRequest = {
                username: data.username,
                password: data.password,
                avatarUrl: data.avatar || undefined // Use selected avatar or undefined
            };

            console.log(" Sending registration request:", {
                ...registerData,
            });

            // Call UserService register method
            const authResponse = await UserService.register(registerData);

            console.log('Registered New User:', authResponse.user.username);
            console.log('User ID:', authResponse.user.id);

            // Navigate to desktop on success (user is automatically logged in)
            router.navigate("/desktop");

        } catch (error) {
            console.error('Registration failed:', error);
            hideLoading();
            showError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
        }
    }

    // Event listeners
    registerBtn.addEventListener("click", handleRegistration);
    cancelBtn.addEventListener("click", () => router.navigate("/login"));

    // Allow Enter key to submit (when focused on input fields)
    const handleEnterKey = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleRegistration();
        }
    };
    
    content.querySelector<HTMLInputElement>("#username")?.addEventListener('keypress', handleEnterKey);
    content.querySelector<HTMLInputElement>("#password")?.addEventListener('keypress', handleEnterKey);
    content.querySelector<HTMLInputElement>("#repeat_password")?.addEventListener('keypress', handleEnterKey);

    root.append(simpleWindow);

    // Create the taskbar
    const { taskbar } = createTaskbar({
        startButton: {
            label: "Start",
            onClick: () => router.navigate("/"),
        },
        clock: true,
    });
    root.appendChild(taskbar);

    // Focus on username input for better UX
    setTimeout(() => {
        content.querySelector<HTMLInputElement>("#username")?.focus();
    }, 100);
}


function createAvatarUpload(avatarInput: HTMLInputElement, avatarContainer: HTMLElement): HTMLElement {
    const uploadSection = document.createElement("div");
    uploadSection.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        margin-top: 8px;
    `;
    
    const uploadLabel = document.createElement("label");
    uploadLabel.textContent = "Or upload custom:";
    uploadLabel.style.cssText = `display: block; font-size: 11px; margin-bottom: 4px;`;

    // Hidden file input
    const uploadInput = document.createElement("input");
    uploadInput.type = "file";
    uploadInput.accept = "image/*";
    uploadInput.style.display = "none";
    uploadInput.id = "avatar-file-input";

    // Custom upload button
    const uploadButton = document.createElement("button");
    uploadButton.type = "button";
    uploadButton.textContent = "Browse Files";
    uploadButton.style.cssText = `
        background: #c0c0c0;
        border: 2px outset #c0c0c0;
        padding: 4px 12px;
        font-size: 11px;
        cursor: pointer;
        width: 100%;
        max-width: 120px;
    `;

    // Button hover effects
    uploadButton.onmouseover = () => {
        uploadButton.style.backgroundColor = '#d0d0d0';
    };
    uploadButton.onmouseout = () => {
        uploadButton.style.backgroundColor = '#c0c0c0';
    };

    // File name display
    const fileNameDisplay = document.createElement("div");
    fileNameDisplay.style.cssText = `
        font-size: 9px;
        color: #666;
        text-align: center;
        min-height: 12px;
        word-break: break-all;
        max-width: 120px;
    `;

    // Button click triggers file input
    uploadButton.addEventListener("click", () => {
        uploadInput.click();
    });

    uploadInput.addEventListener("change", () => {
        const file = uploadInput.files?.[0];
        if (file) {
            // Show selected file name
            fileNameDisplay.textContent = file.name.length > 18 
                ? file.name.substring(0, 15) + "..." 
                : file.name;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                avatarInput.value = e.target!.result as string;
                // Clear preset selections
                avatarContainer.querySelectorAll(".avatar-option").forEach(a => {
                    (a as HTMLElement).style.border = "2px solid transparent";
                    a.classList.remove("selected");
                });
            };
            reader.readAsDataURL(file);
        } else {
            fileNameDisplay.textContent = "";
        }
    });

    uploadSection.appendChild(uploadLabel);
    uploadSection.appendChild(uploadButton);
    uploadSection.appendChild(uploadInput);
    uploadSection.appendChild(fileNameDisplay);
    
    return uploadSection;
}