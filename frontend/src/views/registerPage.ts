import { Router } from "../router";
import { createWindow } from "../components/_components";
import { createTaskbar } from "../components/_components";
import { UserService } from "../game/userService";
import type { RegisterRequest, RegistrationResponse } from "../types";
import { AVATAR_PRESETS, DEFAULT_AVATAR_ID } from "../game/avatarConstants"; 
import { ApiService } from "../game/apiService";
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
            const registerData: RegisterRequest = {
                username: data.username,
                password: data.password,
                avatarUrl: data.avatarId, 
                enable2FA: data.twoFactor
            };

            console.log(" Sending registration request:", {
                username: registerData.username,
                enable2FA: registerData.enable2FA,
                avatarId: registerData.avatarUrl
            });

            const response = await UserService.register(registerData);

            // Check if 2FA setup is required
            if ('twoFactorSetup' in response && response.twoFactorSetup) {
                hideLoading();
                // Show 2FA verification modal
                show2FAVerificationModal(response as RegistrationResponse, router);
                return;
            }

            console.log('Registered New User:', (response as any).username);
            console.log('User ID:', (response as any).id);

            router.navigate("/desktop");

        } catch (error) {
            console.error('Registration failed:', error);
            hideLoading();
            showError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
        }
    }

    // New function to show 2FA verification modal
    function show2FAVerificationModal(registrationResponse: RegistrationResponse, router: Router) {
        const setup = registrationResponse.twoFactorSetup!;
        
        // Replace window content with 2FA verification form
        content.innerHTML = `
            <h2 style="margin-top: 0; text-align: center;">Complete 2FA Setup</h2>
            <p style="text-align: center;">Scan this QR code with your authenticator app:</p>
            <div style="text-align: center; margin: 20px 0;">
                <img src="${setup.qrCodeUrl}" alt="QR Code" style="max-width: 200px; border: 1px solid #ccc;" />
            </div>
            <p style="font-size: 12px; color: #666; text-align: center;">${setup.message}</p>
            <div class="field-row-stacked" style="width: 100%; margin-top: 15px;">
                <label for="2fa-code">Enter 6-digit code:</label>
                <input id="2fa-code" type="text" maxlength="6" pattern="[0-9]{6}" 
                       style="width: 100%; padding: 8px; font-size: 18px; letter-spacing: 4px; text-align: center;" />
            </div>
            <div id="2fa-error" style="color: red; margin-top: 10px; display: none; text-align: center;"></div>
            <div id="2fa-loading" style="margin-top: 10px; display: none; text-align: center;">Verifying...</div>
            <div class="field-row" style="margin-top: 15px; gap: 10px;">
                <button id="verify-2fa-btn" type="button" style="flex: 1;">Verify & Complete Registration</button>
                <button id="cancel-2fa-btn" type="button">Cancel</button>
            </div>
        `;

        // Use event delegation on content element
        const handleContentClick = async (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            
            if (target.id === 'verify-2fa-btn' || target.closest('#verify-2fa-btn')) {
                e.preventDefault();
                e.stopPropagation();
                
                // Use getElementById instead of querySelector for IDs starting with numbers
                const codeInput = document.getElementById('2fa-code') as HTMLInputElement;
                const errorDiv = document.getElementById('2fa-error') as HTMLDivElement;
                const loadingDiv = document.getElementById('2fa-loading') as HTMLDivElement;
                const verifyBtn = document.getElementById('verify-2fa-btn') as HTMLButtonElement;
                
                if (!codeInput || !errorDiv || !loadingDiv || !verifyBtn) {
                    console.error('Failed to find 2FA elements');
                    return;
                }
                
                const code = codeInput.value.trim();
                console.log('Verify clicked! Code:', code);
                
                if (!/^\d{6}$/.test(code)) {
                    errorDiv.textContent = 'Please enter a valid 6-digit code';
                    errorDiv.style.display = 'block';
                    return;
                }

                verifyBtn.disabled = true;
                errorDiv.style.display = 'none';
                loadingDiv.style.display = 'block';

                try {
                    console.log('🔵 [2FA] Calling verification endpoint...');
                    console.log('🔵 [2FA] Registration token:', setup.registrationToken.substring(0, 8) + '...');
                    console.log('🔵 [2FA] Code:', code);
                    
                    const verificationResponse = await ApiService.post<RegistrationResponse>('/users/auth/2fa/verify-registration', {
                        registrationToken: setup.registrationToken,
                        code: code
                    });

                    console.log('✅ [2FA] Verification successful!', verificationResponse);
                    console.log('✅ [2FA] User ID:', verificationResponse.id);
                    console.log('✅ [2FA] Username:', verificationResponse.username);

                    if (verificationResponse.id) {
                        localStorage.setItem('userId', verificationResponse.id.toString());
                        localStorage.setItem('username', verificationResponse.username);
                    }

                    if (verificationResponse.backupCodes && verificationResponse.backupCodes.length > 0) {
                        console.log('✅ [2FA] Showing backup codes');
                        showBackupCodes(verificationResponse.backupCodes, router);
                    } else {
                        console.log('✅ [2FA] No backup codes, navigating to desktop');
                        router.navigate("/desktop");
                    }
                } catch (error: any) {
                    console.error('❌ [2FA] Verification error:', error);
                    console.error('❌ [2FA] Error details:', error?.details);
                    console.error('❌ [2FA] Error message:', error?.message);
                    console.error('❌ [2FA] Full error:', JSON.stringify(error, null, 2));
                    
                    verifyBtn.disabled = false;
                    loadingDiv.style.display = 'none';
                    
                    const errorMessage = error?.details?.error || error?.details?.details || error?.message || 'Verification failed. Please try again.';
                    errorDiv.textContent = errorMessage;
                    errorDiv.style.display = 'block';
                    codeInput.value = '';
                    codeInput.focus();
                }
            } else if (target.id === 'cancel-2fa-btn' || target.closest('#cancel-2fa-btn')) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Cancel clicked!');
                router.navigate("/login");
            }
        };

        // Remove any existing listener and add new one
        content.removeEventListener('click', handleContentClick);
        content.addEventListener('click', handleContentClick, true); // Use capture phase

        // Handle Enter key
        setTimeout(() => {
            const codeInput = document.getElementById('2fa-code') as HTMLInputElement;
            if (codeInput) {
                codeInput.focus();
                codeInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const verifyBtn = document.getElementById('verify-2fa-btn') as HTMLButtonElement;
                        if (verifyBtn) {
                            verifyBtn.click();
                        }
                    }
                });
            }
        }, 50);
    }

    // New function to show backup codes
    function showBackupCodes(backupCodes: string[], router: Router) {
        const modal = document.createElement("div");
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #000;
            padding: 20px;
            z-index: 10001;
            max-width: 400px;
            box-shadow: 4px 4px 0px rgba(0,0,0,0.2);
        `;

        modal.innerHTML = `
            <h2 style="margin-top: 0;">Save Your Backup Codes</h2>
            <p style="color: red; font-weight: bold;">⚠️ These codes are shown only once!</p>
            <p>Save these backup codes in a safe place. You can use them to log in if you lose access to your authenticator app.</p>
            <div style="background: #f5f5f5; padding: 15px; margin: 15px 0; font-family: monospace; text-align: center;">
                ${backupCodes.map(code => `<div style="padding: 5px;">${code}</div>`).join('')}
            </div>
            <button id="backup-codes-ok" style="width: 100%;">I've Saved These Codes</button>
        `;

        const okBtn = modal.querySelector<HTMLButtonElement>('#backup-codes-ok')!;
        okBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
            router.navigate("/desktop");
        });

        document.body.appendChild(modal);
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