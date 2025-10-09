import { Router } from "../router";
import { createWindow } from "./components";
import { createTaskbar } from "./components";
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
                // Clear preset selections
                avatarContainer.querySelectorAll(".avatar-option").forEach(a => {
                    (a as HTMLElement).style.border = "2px solid transparent";
                    a.classList.remove("selected");
                });
            };
            reader.readAsDataURL(file);
        }
    });

    avatarSection.appendChild(uploadLabel);
    avatarSection.appendChild(uploadInput);

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
    // Helper functions
    // ----------------------------
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

    // ----------------------------
    // Collect and validate data
    // ----------------------------
    function getRegistrationData() {
        const username = (content.querySelector<HTMLInputElement>("#username")!).value.trim();
        const email = (content.querySelector<HTMLInputElement>("#email")!).value.trim();
        const password = (content.querySelector<HTMLInputElement>("#password")!).value;
        const repeatPassword = (content.querySelector<HTMLInputElement>("#repeat_password")!).value;
        const twoFactor = (content.querySelector<HTMLInputElement>('input[name="twofactor"]:checked')!)?.value === "yes";
        const bio = (content.querySelector<HTMLTextAreaElement>("#profileBio")!).value.trim();
        const avatar = (content.querySelector<HTMLInputElement>("#avatar")!).value;

        return { username, email, password, repeatPassword, twoFactor, bio, avatar };
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
        console.log('📝 Registration attempt started');
        
        const data = getRegistrationData();
        console.log("📤 Collected registration data:", {
            ...data,
            password: '***',
            repeatPassword: '***'
        });

        // Validate data
        const validationError = validateRegistrationData(data);
        if (validationError) {
            showError(validationError);
            return;
        }

        showLoading();

        try {
            // Create RegisterRequest object (matches your backend interface)
            const registerData: RegisterRequest = {
                username: data.username,
                password: data.password,
                avatarUrl: data.avatar || undefined // Use selected avatar or undefined
            };

            console.log("🚀 Sending registration request:", {
                ...registerData,
                password: '***'
            });

            // Call UserService register method
            const authResponse = await UserService.register(registerData);

            console.log('✅ Registration successful!', {
                user: authResponse.user,
                token: authResponse.token ? 'Token received' : 'No token',
                expiresAt: authResponse.expiresAt
            });

            console.log('💾 User data saved to localStorage');
            console.log('👤 Registered as:', authResponse.user.username);
            console.log('🆔 New User ID:', authResponse.user.id);

            // TODO: When backend is ready, you'll also save the extra fields:
            console.log('📋 Extra data that will be sent to backend later:', {
                email: data.email,
                twoFactorEnabled: data.twoFactor,
                bio: data.bio
            });

            // Navigate to desktop on success (user is automatically logged in)
            router.navigate("/desktop");

        } catch (error) {
            console.error('❌ Registration failed:', error);
            hideLoading();
            showError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
        }
    }

    // ----------------------------
    // Event listeners
    // ----------------------------
    registerBtn.addEventListener("click", handleRegistration);
    cancelBtn.addEventListener("click", () => router.navigate("/login"));

    // Allow Enter key to submit (when focused on input fields)
    const handleEnterKey = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleRegistration();
        }
    };
    
    content.querySelector<HTMLInputElement>("#username")?.addEventListener('keypress', handleEnterKey);
    content.querySelector<HTMLInputElement>("#email")?.addEventListener('keypress', handleEnterKey);
    content.querySelector<HTMLInputElement>("#password")?.addEventListener('keypress', handleEnterKey);
    content.querySelector<HTMLInputElement>("#repeat_password")?.addEventListener('keypress', handleEnterKey);

    // ----------------------------
    // Attach to DOM
    // ----------------------------
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