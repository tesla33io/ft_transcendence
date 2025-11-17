import { Router } from '../router';
import { createWindow } from '../components/_components';
import { createTaskbar, createStaticDesktopBackground } from "../components/_components";
import { UserService } from "../game/userService";
import type { PublicUser, ProfileUpdateRequest } from "../types";
import { AVATAR_PRESETS, DEFAULT_AVATAR_ID, resolveAvatar } from "../game/avatarConstants";

// Global variables for cleanup
let staticBackground: any = null;

export async function settingsView(router: Router) {
    const app = document.getElementById('app');
    if (!app) {
        console.error("App element not found!");
        return;
    }

    // Initialize page with background
    initializePage(app);

    // Show loading state while fetching data
    showLoadingState(app, router);

    try {
        const currentUser = await UserService.getCurrentUser();
        console.log('Current user loaded:', currentUser.username);
        console.log('Current user data:', currentUser); 
        
        buildSettingsUI(app, router, currentUser);
        
    } catch (error) {
        console.error('Failed to load user settings:', error);
        showErrorState(app, router);
    }
}

// PAGE INITIALIZATION
function initializePage(app: HTMLElement) {
    app.innerHTML = '';
    staticBackground = createStaticDesktopBackground();
    staticBackground.attachToPage(document.body);

    if (!document.querySelector('#spinner-style')) {
        const style = document.createElement('style');
        style.id = 'spinner-style';
        style.textContent = `
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

// SHARED UI CREATORS
function createPageLayout(app: HTMLElement, window: HTMLElement, router: Router) {
    app.innerHTML = '';
    app.appendChild(window);
    
    const { taskbar } = createTaskbar({
        clock: true,
        router: router
    });
    
    app.appendChild(taskbar);
}

function cleanupPage() {
    if (staticBackground) {
        staticBackground.remove();
        staticBackground = null;
    }
}

function createCloseHandler(router: Router, navigateTo: string = "/desktop") {
    return () => {
        cleanupPage();
        router.navigate(navigateTo);
    };
}

function showLoadingState(app: HTMLElement, router: Router) {
    const loadingContent = document.createElement("div");
    loadingContent.style.cssText = `
        text-align: center;
        padding: 50px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
    `;

    const spinner = document.createElement("div");
    spinner.textContent = "⏳";
    spinner.style.cssText = `
        font-size: 32px;
        animation: spin 1s linear infinite;
    `;

    const loadingText = document.createElement("div");
    loadingText.textContent = "Loading settings...";
    loadingText.style.cssText = `
        font-size: 14px;
        color: #404040;
    `;

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.cssText = `padding: 8px 20px; margin-top: 10px;`;
    cancelBtn.addEventListener("click", createCloseHandler(router));

    loadingContent.appendChild(spinner);
    loadingContent.appendChild(loadingText);
    loadingContent.appendChild(cancelBtn);

    const loadingWindow = createWindow({
        title: "Settings",
        width: "300px",
        height: "200px",
        content: loadingContent,
        titleBarControls: {
            close: true,
            onClose: createCloseHandler(router)
        }
    });

    createPageLayout(app, loadingWindow, router);
}

// ERROR STATE
function showErrorState(app: HTMLElement, router: Router) {
    const errorContent = document.createElement("div");
    errorContent.style.cssText = `text-align: center; padding: 40px;`;
    
    errorContent.innerHTML = `
        <h2 style="color: red;">Failed to Load Settings</h2>
        <p>Could not load user settings. Please try again.</p>
    `;

    const buttonContainer = document.createElement("div");
    buttonContainer.style.marginTop = "20px";

    const retryBtn = document.createElement("button");
    retryBtn.textContent = "Try Again";
    retryBtn.style.marginRight = "10px";
    retryBtn.addEventListener("click", () => {
        showLoadingState(app, router);
        
        UserService.getCurrentUser()
            .then(currentUser => buildSettingsUI(app, router, currentUser))
            .catch(error => {
                console.error('Retry failed:', error);
                showErrorState(app, router);
            });
    });

    const backBtn = document.createElement("button");
    backBtn.textContent = "Go Back";
    backBtn.addEventListener("click", createCloseHandler(router));

    buttonContainer.appendChild(retryBtn);
    buttonContainer.appendChild(backBtn);
    errorContent.appendChild(buttonContainer);

    const errorWindow = createWindow({
        title: "Settings Error",
        width: "350px",
        content: errorContent,
        titleBarControls: {
            close: true,
            onClose: createCloseHandler(router)
        }
    });

    createPageLayout(app, errorWindow, router);
}

// MAIN SETTINGS UI
function buildSettingsUI(app: HTMLElement, router: Router, currentUser: PublicUser) {
    const content = createMainContent();
    addSettingsSections(content, currentUser);

    const setupWindow = createWindow({
        title: `Profile Settings`,
        width: "500px",
        height: "400px",
        content: content,
        titleBarControls: {
            help: true,
            close: true,
            onClose: createCloseHandler(router)
        }
    });

    createPageLayout(app, setupWindow, router);
}

function createMainContent(): HTMLElement {
    const content = document.createElement("div");
    content.style.cssText = `
        padding: 15px;
        height: 100%;
        display: flex;
        flex-direction: column;
    `;

    // Main heading
    const mainHeading = document.createElement("h2");
    mainHeading.textContent = "Profile Settings";
    mainHeading.style.cssText = `
        text-align: center;
        margin: 0 0 15px 0;
        font-size: 20px;
        font-weight: bold;
        color: #1e40af;
        border-bottom: 1px solid #c0c0c0;
        padding-bottom: 8px;
    `;
    content.appendChild(mainHeading);

    return content;
}

function addSettingsSections(content: HTMLElement, currentUser: PublicUser) {
    const mainContainer = document.createElement("div");
    mainContainer.style.cssText = `
        display: flex;
        gap: 15px;
        flex: 1;
        min-height: 0;
    `;

    mainContainer.appendChild(createUsernameSection(currentUser));
    mainContainer.appendChild(createAvatarSection(currentUser));

    content.appendChild(mainContainer);

    // Status messages
    content.appendChild(createStatusDiv());
}

// HELPER FUNCTIONS
function createPanel(): HTMLElement {
    const panel = document.createElement("div");
    panel.className = "sunken-panel";
    panel.style.cssText = `
        padding: 10px;
        background-color: #e0e0e0;
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 0;
        overflow: hidden;
    `;
    return panel;
}

function createStatusDiv(): HTMLElement {
    const statusDiv = document.createElement("div");
    statusDiv.id = "status_message";
    statusDiv.style.cssText = `
        text-align: center;
        margin: 10px 0;
        padding: 6px;
        display: none;
        border-radius: 4px;
        font-size: 12px;
    `;
    return statusDiv;
}


// ===== USERNAME SECTION =====
function createUsernameSection(currentUser: PublicUser): HTMLElement {
    const section = createPanel();
    section.innerHTML = `
        <div>
            <div class="field-row-stacked" style="width: 100%; margin: 6px 0;">
                <label for="current_username">Current Username</label>
                <input id="current_username" type="text" value="${currentUser.username}" disabled style="background: #f0f0f0;" />
            </div>
            <div class="field-row-stacked" style="width: 100%; margin: 6px 0;">
                <label for="new_username">New Username</label>
                <input id="new_username" type="text" placeholder="Enter new username" maxlength="30" />
            </div>
        </div>
        <button id="save_username" style="margin-top: auto; width: 100%;">Update Username</button>
    `;
    
    setupUsernameHandlers(section, currentUser);
    return section;
}

function setupUsernameHandlers(section: HTMLElement, currentUser: PublicUser) {
    const saveBtn = section.querySelector("#save_username") as HTMLButtonElement;
    const newUsernameInput = section.querySelector("#new_username") as HTMLInputElement;
    const currentUsernameInput = section.querySelector("#current_username") as HTMLInputElement;

    saveBtn.addEventListener("click", async () => {
        const newUsername = newUsernameInput.value.trim();
        
        if (!newUsername) {
            showStatus("Please enter a new username", true);
            return;
        }

        setButtonLoading(saveBtn, true);
        
        try {
            console.log('[Settings] Updating username to:', newUsername);
            const updates: ProfileUpdateRequest = { username: newUsername };
            
            // Update profile
            await UserService.updateProfile(updates);
        
            const updatedUser = await UserService.getCurrentUser();

            showStatus("Username updated successfully!");
            
            currentUsernameInput.value = updatedUser.username;
            newUsernameInput.value = "";
            currentUser.username = updatedUser.username;
            currentUser.avatarUrl = updatedUser.avatarUrl;
            currentUser.onlineStatus = updatedUser.onlineStatus;
            currentUser.activityType = updatedUser.activityType;
            currentUser.lastLogin = updatedUser.lastLogin;
            
        } catch (error) {
            console.error('[Settings] Failed to update username:', error);
            showStatus("Failed to update username. Please try again.", true);
        } finally {
            setButtonLoading(saveBtn, false);
        }
    });
}

// ===== AVATAR SECTION =====
function createAvatarSection(currentUser: PublicUser): HTMLElement {
    const section = createPanel();
    
    const avatarContent = document.createElement("div");
    avatarContent.style.cssText = `
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 10px;
    `;

    const currentAvatarDiv = document.createElement("div");
    currentAvatarDiv.style.cssText = `text-align: center;`;
    currentAvatarDiv.innerHTML = `<label style="display: block; margin-bottom: 5px; font-size: 11px;">Current Avatar:</label>`;

    const currentAvatar = document.createElement("img");
    currentAvatar.id = "current_avatar_img";
    currentAvatar.src = resolveAvatar(currentUser.avatarUrl);
    currentAvatar.width = 50;
    currentAvatar.height = 50;
    currentAvatar.style.cssText = `
        border: 2px solid #c0c0c0;
        display: block;
        margin: 0 auto;
        border-radius: 4px;
    `;
    currentAvatarDiv.appendChild(currentAvatar);
    avatarContent.appendChild(currentAvatarDiv);

    const selectLabel = document.createElement("label");
    selectLabel.textContent = "Select New Avatar:";
    selectLabel.style.cssText = `
        display: block;
        text-align: center;
        font-size: 11px;
        margin-bottom: 5px;
    `;
    avatarContent.appendChild(selectLabel);

    const avatarContainer = document.createElement("div");
    avatarContainer.style.cssText = `
        display: flex;
        gap: 10px;
        justify-content: center;
        margin-bottom: 10px;
    `;

    const avatarInput = document.createElement("input");
    avatarInput.type = "hidden";
    avatarInput.id = "new_avatar_id";

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
        img.width = 45;
        img.height = 45;
        img.style.cssText = `
            border: 3px solid transparent;
            border-radius: 4px;
            transition: border-color 0.2s;
        `;
        img.classList.add("avatar-option");
        img.dataset.avatarId = avatar.id;

        const label = document.createElement("span");
        label.textContent = avatar.name;
        label.style.cssText = `font-size: 9px; color: #333;`;

        avatarWrapper.addEventListener("click", () => {
            avatarContainer.querySelectorAll(".avatar-option").forEach(a => {
                (a as HTMLElement).style.borderColor = "transparent";
                a.classList.remove("selected");
            });
            
            img.style.borderColor = "#0000ff";
            img.classList.add("selected");
            avatarInput.value = avatar.id;
        });

        avatarWrapper.appendChild(img);
        avatarWrapper.appendChild(label);
        avatarContainer.appendChild(avatarWrapper);
    });

    avatarContent.appendChild(avatarContainer);
    avatarContent.appendChild(avatarInput);
    section.appendChild(avatarContent);

    const saveBtn = document.createElement("button");
    saveBtn.id = "save_avatar";
    saveBtn.textContent = "Update Avatar";
    saveBtn.style.cssText = `width: 100%;`;
    section.appendChild(saveBtn);

    setupAvatarHandlers(section, currentUser);
    return section;
}

function setupAvatarHandlers(section: HTMLElement, currentUser: PublicUser) {
    const saveBtn = section.querySelector("#save_avatar") as HTMLButtonElement;
    const avatarInput = section.querySelector("#new_avatar_id") as HTMLInputElement;
    const currentAvatarImg = section.querySelector("#current_avatar_img") as HTMLImageElement;

    saveBtn.addEventListener("click", async () => {
        const selectedAvatarId = avatarInput.value;
        
        if (!selectedAvatarId) {
            showStatus("Please select an avatar", true);
            return;
        }

        setButtonLoading(saveBtn, true);
        
        try {
            console.log('📤 [Settings] Updating avatar to:', selectedAvatarId);
            
            const updates: ProfileUpdateRequest = { 
                avatarUrl: selectedAvatarId
            };
            
            const updatedUser = await UserService.updateProfile(updates);
            
            console.log('Settings] Avatar updated successfully');
            showStatus("Avatar updated successfully!");
            
            currentAvatarImg.src = resolveAvatar(updatedUser.avatarUrl);

            avatarInput.value = "";
            section.querySelectorAll(".avatar-option").forEach(a => {
                (a as HTMLElement).style.borderColor = "transparent";
                a.classList.remove("selected");
            });
            
        } catch (error) {
            console.error('[Settings] Failed to update avatar:', error);
            showStatus("Failed to update avatar. Please try again.", true);
        } finally {
            setButtonLoading(saveBtn, false);
        }
    });
}

// ===== UTILITY FUNCTIONS =====
function showStatus(message: string, isError: boolean = false) {
    const statusDiv = document.getElementById("status_message")!;
    statusDiv.textContent = message;
    statusDiv.style.display = "block";
    statusDiv.style.color = isError ? "red" : "green";
    statusDiv.style.backgroundColor = isError ? "#ffe6e6" : "#e6ffe6";
    statusDiv.style.border = `1px solid ${isError ? "#ffcccc" : "#ccffcc"}`;
    
    setTimeout(() => {
        statusDiv.style.display = "none";
    }, 3000);
}

function setButtonLoading(button: HTMLButtonElement, loading: boolean) {
    if (loading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent || '';
        button.textContent = "Saving...";
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || 'Save';
    }
}