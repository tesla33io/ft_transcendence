import { Router } from "../router";
import { createWindow } from "../components/_components";
import { UserService } from "../game/userService";
import type { LoginRequest, AuthResponse } from "../types";


export function loginView(router: Router) {
    const root = document.getElementById("app")!;
    root.innerHTML = "";

    // --- Content container ---
    const content = document.createElement("div");

    // --- Username field ---
    const usernameField = document.createElement("div");
    usernameField.className = "field-row-stacked";
    usernameField.style.width = "200px";

    const usernameLabel = document.createElement("label");
    usernameLabel.htmlFor = "text18";
    usernameLabel.textContent = "Username";

    const usernameInput = document.createElement("input");
    usernameInput.id = "text18";
    usernameInput.type = "text";
    usernameInput.className = "mb-4"; // margin-bottom: 16px

    usernameField.appendChild(usernameLabel);
    usernameField.appendChild(usernameInput);

    // --- Password field ---
    const passwordField = document.createElement("div");
    passwordField.className = "field-row-stacked";
    passwordField.style.width = "200px";

    const passwordLabel = document.createElement("label");
    passwordLabel.htmlFor = "text19";
    passwordLabel.textContent = "Password";

    const passwordInput = document.createElement("input");
    passwordInput.id = "text19";
    passwordInput.type = "password";
    passwordInput.className = "mb-4";  // margin-bottom: 16px

    passwordField.appendChild(passwordLabel);
    passwordField.appendChild(passwordInput);

    // Add 2FA code input field (initially hidden)
    const twoFactorField = document.createElement("div");
    twoFactorField.className = "field-row-stacked";
    twoFactorField.style.width = "200px";
    twoFactorField.style.display = "none"; // Hidden by default

    const twoFactorLabel = document.createElement("label");
    twoFactorLabel.htmlFor = "2fa-code-input";
    twoFactorLabel.textContent = "2FA Code or Backup Code";

    const twoFactorInput = document.createElement("input");
    twoFactorInput.id = "2fa-code-input";
    twoFactorInput.type = "text";
    twoFactorInput.maxLength = 8; // Changed from 6 to 8 to allow backup codes
    twoFactorInput.pattern = "[0-9]{6,8}"; // Changed to allow 6-8 digits
    twoFactorInput.placeholder = "000000 or backup code";
    twoFactorInput.style.textAlign = "center";
    twoFactorInput.style.letterSpacing = "4px";
    twoFactorInput.style.fontSize = "18px";

    twoFactorField.appendChild(twoFactorLabel);
    twoFactorField.appendChild(twoFactorInput);

    // Store username/password for 2FA retry
    let pendingCredentials: { username: string; password: string } | null = null;

    // --- Error message area ---
    const errorMessage = document.createElement("div");
    errorMessage.style.color = "red";
    errorMessage.style.textAlign = "center";
    errorMessage.style.marginTop = "10px";
    errorMessage.style.display = "none";

    // --- Loading message ---
    const loadingMessage = document.createElement("div");
    loadingMessage.textContent = "Logging in...";
    loadingMessage.style.textAlign = "center";
    loadingMessage.style.marginTop = "10px";
    loadingMessage.style.display = "none";

    // --- Buttons row ---
    const buttonRow = document.createElement("div");
    buttonRow.className = "field-row";

    const loginBtn = document.createElement("button");
    loginBtn.id = "loginBtn";
    loginBtn.textContent = "Login";


    const registerBtn = document.createElement("button");
    registerBtn.id = "registerBtn";
    registerBtn.textContent = "Register";

    const guestBtn = document.createElement("button");
    guestBtn.id = "guestBtn";
    guestBtn.textContent = "Play as guest";

    buttonRow.appendChild(loginBtn);
    buttonRow.appendChild(registerBtn);
    buttonRow.appendChild(guestBtn);

    // --- Assemble content ---
    content.appendChild(usernameField);
    content.appendChild(passwordField);
    content.appendChild(twoFactorField); // Add 2FA field
    content.appendChild(errorMessage);
    content.appendChild(loadingMessage);
    content.appendChild(buttonRow);

    // --- Create window with content ---
    const loginWindow = createWindow({
        title: "Transcendence Os",
        width: "400px",
        content: content,
        titleBarControls: {
            help: true
        }
    });

    // --- Event listeners ---
    loginBtn.addEventListener("click", async () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        // Basic validation
        if (!username || !password) {
            showError("Please enter both username and password");
            return;
        }

        await handleLogin(username, password, router);
    });

    // Allow Enter key to submit (including 2FA field)
    const handleEnterKey = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (twoFactorField.style.display === "none") {
                // Normal login
                loginBtn.click();
            } else {
                // 2FA code entered, retry login
                if (pendingCredentials) {
                    handleLogin(pendingCredentials.username, pendingCredentials.password, router);
                }
            }
        }
    };
    usernameInput.addEventListener('keypress', handleEnterKey);
    passwordInput.addEventListener('keypress', handleEnterKey);
    twoFactorInput.addEventListener('keypress', handleEnterKey); // Add for 2FA field

    registerBtn.addEventListener("click", () => router.navigate("/register"));
    guestBtn.addEventListener("click", async () => await handleGuestLogin(router));

    // --- Helper functions ---
    function showError(message: string) {
        errorMessage.textContent = message;
        errorMessage.style.display = "block";
        loadingMessage.style.display = "none";
    }

    function showLoading(message: string = "Logging in...") {
        loadingMessage.textContent = message;
        loadingMessage.style.display = "block";
        errorMessage.style.display = "none";
        loginBtn.disabled = true;
        guestBtn.disabled = true;
        registerBtn.disabled = true;
    }

    function hideLoading() {
        loadingMessage.style.display = "none";
        loginBtn.disabled = false;
        guestBtn.disabled = false;
        registerBtn.disabled = false;
        loginBtn.textContent = "Login";
    }

    async function handleLogin(username: string, password: string, router: Router) {
        showLoading();

        try {
            // Create LoginRequest object
            const credentials: LoginRequest = {
                username: username,
                password: password,
                twoFactorCode: twoFactorInput.value.trim() || undefined // Include 2FA code if entered
            };

            console.log('login request:', {
                ...credentials,
                password: '***',
                twoFactorCode: credentials.twoFactorCode ? '***' : undefined
            });

            // Call UserService login method
            const response = await UserService.login(credentials);

            // Check if 2FA is required
            if ('requires2FA' in response && response.requires2FA) {
                hideLoading();
                // Show 2FA input field
                twoFactorField.style.display = "block";
                twoFactorInput.focus();
                pendingCredentials = { username, password };
                showError(response.message || 'Enter code from authenticator app');
                return;
            }

            // Normal login successful
            const authResponse = response as AuthResponse;
            console.log('Login successful!', {
                user: authResponse.user,
                token: authResponse.token ? 'Token received' : 'No token',
            });

            // Reset 2FA field for next login
            twoFactorField.style.display = "none";
            twoFactorInput.value = "";
            pendingCredentials = null;

            //test me endpoint
            try {
                console.log('📍 Calling /me endpoint to verify user...');
                const meData = await UserService.getMe();
                console.log('✅ /me endpoint verified:', {
                    id: meData.id,
                    username: meData.username,
                    role: meData.role
                });
            } catch (meError) {
                console.error('⚠️ /me endpoint failed:', meError);
            }

            router.navigate("/desktop");

        } catch (error: any) {
            console.error('Login failed:', error);
            hideLoading();
            
            // If we have pending credentials and error is about 2FA, show the field
            if (pendingCredentials && error.details?.requires2FA) {
                twoFactorField.style.display = "block";
                twoFactorInput.focus();
                showError(error.details.message || 'Enter code from authenticator app');
            } else {
                // Clear 2FA field on other errors
                twoFactorField.style.display = "none";
                twoFactorInput.value = "";
                pendingCredentials = null;
                showError(error instanceof Error ? error.message : 'Login failed. Please try again.');
            }
        }
    }

    async function handleGuestLogin(router: Router) {
        showLoading("Creating guest session...");

        try {
            console.log('🎮 Guest login request');

            const response = await fetch(`http://${window.location.hostname}:3000/api/v1/auth/guest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
				body: JSON.stringify({}),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Guest session failed: ${response.status}`);
            }

            const data = await response.json();

            console.log('✅ Guest session created!', {
                id: data.id,
                username: data.username,
                role: data.role,
                token: data.accessToken ? 'Token received' : 'No token'
            });

            // Store guest token and info
            localStorage.setItem('authToken', data.accessToken);
            localStorage.setItem('userId', data.id.toString());
            localStorage.setItem('username', data.username);


            router.navigate("/guest");

        } catch (error) {
            console.error('❌ Guest login failed:', error);
            hideLoading();
            showError(error instanceof Error ? error.message : 'Failed to create guest session. Please try again.');
        }
    }

    // --- Attach to root ---
    root.appendChild(loginWindow);

    // Focus on username input for better UX
    setTimeout(() => usernameInput.focus(), 100);
}
