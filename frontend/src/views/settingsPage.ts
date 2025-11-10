import { Router } from '../router';
import { createWindow } from '../components/_components';
import { createTaskbar, createStaticDesktopBackground } from "../components/_components";
import { UserService } from "../game/userService";
import type { PublicUser, ProfileUpdateRequest } from "../types";
import agent from "./images/msagent.png"
import book_user from "./images/book_user.png"
import rabit from "./images/rabit.png"

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
    addBackButton(content, router);
    
    const setupWindow = createWindow({
        title: `Profile settings`,
        width: "650px",
        height: "600px", 
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
        font-size: 24px;
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
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr;
        gap: 15px;
        flex: 1;
        min-height: 0;
    `;

    const leftColumn = createColumn();
    const rightColumn = createColumn();

    // sections to columns
    leftColumn.appendChild(createUsernameSection(currentUser));
    leftColumn.appendChild(createBioSection(currentUser));
    rightColumn.appendChild(createPasswordSection());
    rightColumn.appendChild(createAvatarSection(currentUser));

    mainContainer.appendChild(leftColumn);
    mainContainer.appendChild(rightColumn);
    content.appendChild(mainContainer);

    // status messages
    content.appendChild(createStatusDiv());
}

function createColumn(): HTMLElement {
    const column = document.createElement("div");
    column.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 15px;
    `;
    return column;
}

// SETTINGS SECTION
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

function createBioSection(currentUser: PublicUser): HTMLElement {
    const section = createPanel();
    section.innerHTML = `
        <div>
            <div class="field-row-stacked" style="width: 100%; margin: 6px 0;">
                <label for="current_bio">Current Bio</label>
                <textarea id="current_bio" rows="2" disabled style="background: #f0f0f0; resize: none; width: 100%; box-sizing: border-box;">${currentUser.activityType || 'No bio set'}</textarea>
            </div>
            <div class="field-row-stacked" style="width: 100%; margin: 6px 0;">
                <label for="new_bio">New Bio</label>
                <textarea id="new_bio" rows="2" placeholder="Tell others about yourself..." maxlength="200" style="resize: none; width: 100%; box-sizing: border-box;"></textarea>
            </div>
        </div>
        <button id="save_bio" style="margin-top: auto; width: 100%;">Update Bio</button>
    `;
    
    setupBioHandlers(section);
    return section;
}

function createPasswordSection(): HTMLElement {
    const section = createPanel();
    section.innerHTML = `
        <div>
            <div class="field-row-stacked" style="width: 100%; margin: 6px 0;">
                <label for="current_password">Current Password</label>
                <input id="current_password" type="password" placeholder="Enter current password" />
            </div>
            <div class="field-row-stacked" style="width: 100%; margin: 6px 0;">
                <label for="new_password">New Password</label>
                <input id="new_password" type="password" placeholder="Enter new password" />
            </div>
            <div class="field-row-stacked" style="width: 100%; margin: 6px 0;">
                <label for="confirm_password">Confirm New Password</label>
                <input id="confirm_password" type="password" placeholder="Confirm new password" />
            </div>
        </div>
        <button id="save_password" style="margin-top: auto; width: 100%;">Update Password</button>
    `;
    
    setupPasswordHandlers(section);
    return section;
}

function createAvatarSection(currentUser: PublicUser): HTMLElement {
    const section = createPanel();
    
    const avatarContent = document.createElement("div");
    avatarContent.style.cssText = `
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 6px; 
    `;

    // Current avatar display
    const topSection = createCurrentAvatarDisplay(currentUser);
    avatarContent.appendChild(topSection);

    // Avatar selection
    const { avatarContainer, avatarInput } = createAvatarSelector();
    avatarContent.appendChild(avatarContainer);

    // Upload section
    avatarContent.appendChild(createAvatarUpload(avatarInput, avatarContainer));

    section.appendChild(avatarContent);

    // Save button
    const saveBtn = document.createElement("button");
    saveBtn.id = "save_avatar";
    saveBtn.textContent = "Update Avatar";
    saveBtn.style.cssText = `width: 100%; font-size: 10px; padding: 3px;`; 
    section.appendChild(saveBtn);

    setupAvatarHandlers(section, currentUser, avatarContainer);
    return section;
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

function addBackButton(content: HTMLElement, router: Router) {
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "field-row";
    buttonContainer.style.cssText = `
        justify-content: center;
        border-top: 1px solid #c0c0c0;
        padding-top: 10px;
        flex-shrink: 0;
    `;

    const backBtn = document.createElement("button");
    backBtn.textContent = "Back";
    backBtn.style.cssText = `padding: 6px 25px; font-size: 13px;`;
    backBtn.addEventListener("click", () => router.navigate("/profile"));

    buttonContainer.appendChild(backBtn);
    content.appendChild(buttonContainer);
}

// AVATAR HELPERS
function createCurrentAvatarDisplay(currentUser: PublicUser): HTMLElement {
    const topSection = document.createElement("div");
    
    const currentAvatarDiv = document.createElement("div");
    currentAvatarDiv.style.cssText = `text-align: center; margin-bottom: 4px;`; 
    currentAvatarDiv.innerHTML = `<label style="display: block; margin-bottom: 2px; font-size: 10px;">Current Avatar:</label>`;

    const currentAvatar = document.createElement("img");
    currentAvatar.src = currentUser.avatarUrl || agent;
    currentAvatar.width = 32; 
    currentAvatar.height = 32;
    currentAvatar.style.cssText = `
        border: 2px solid #c0c0c0;
        display: block;
        margin: 0 auto;
    `;
    
    currentAvatarDiv.appendChild(currentAvatar);
    topSection.appendChild(currentAvatarDiv);

    return topSection;
}

function createAvatarSelector(): { avatarContainer: HTMLElement, avatarInput: HTMLInputElement } {
    const label = document.createElement("label");
    label.textContent = "Select New:";
    label.style.cssText = `
        display: block;
        text-align: center;
        font-size: 10px; 
        margin-bottom: 3px; 
    `;

    const avatarContainer = document.createElement("div");
    avatarContainer.style.cssText = `
        display: flex;
        gap: 4px; 
        justify-content: center;
        margin-bottom: 6px; 
    `;

    const avatarInput = document.createElement("input");
    avatarInput.type = "hidden";
    avatarInput.id = "new_avatar";

    const avatars = [agent, book_user, rabit];
    avatars.forEach(src => {
        const img = document.createElement("img");
        img.src = src;
        img.width = 26; 
        img.height = 26;
        img.style.cssText = `
            cursor: pointer;
            border: 2px solid transparent;
        `;
        img.classList.add("avatar-option");

        img.addEventListener("click", () => {
            // Clear all selections
            avatarContainer.querySelectorAll(".avatar-option").forEach(a => {
                (a as HTMLElement).style.border = "2px solid transparent";
                a.classList.remove("selected");
            });
            // Set new selection
            img.style.border = "2px solid #0000ff";
            img.classList.add("selected");
            avatarInput.value = src;
        });

        avatarContainer.appendChild(img);
    });

    const container = document.createElement("div");
    container.appendChild(label);
    container.appendChild(avatarContainer);
    container.appendChild(avatarInput);

    return { avatarContainer: container, avatarInput };
}

function createAvatarUpload(avatarInput: HTMLInputElement, avatarContainer: HTMLElement): HTMLElement {
    const uploadSection = document.createElement("div");
    uploadSection.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px; 
    `;
    
    const uploadLabel = document.createElement("label");
    uploadLabel.textContent = "Or upload:";
    uploadLabel.style.cssText = `display: block; font-size: 9px; margin-bottom: 2px;`; /* ✅ Smaller font */

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
        padding: 2px 8px; /* ✅ Smaller padding */
        font-size: 9px; /* ✅ Smaller font */
        cursor: pointer;
        width: 100%;
        max-width: 100px; /* ✅ Smaller max width */
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
        font-size: 8px; 
        color: #666;
        text-align: center;
        min-height: 10px; 
        word-break: break-all;
        max-width: 100px; 
    `;

    // Button click triggers file input
    uploadButton.addEventListener("click", () => {
        uploadInput.click();
    });

    uploadInput.addEventListener("change", () => {
        const file = uploadInput.files?.[0];
        if (file) {
            // Show selected file name
            fileNameDisplay.textContent = file.name.length > 15  
                ? file.name.substring(0, 12) + "..." 
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
        
        if (newUsername === currentUser.username) {
            showStatus("New username must be different from current username", true);
            return;
        }

        setButtonLoading(saveBtn, true);
        
        try {
            console.log('Updating username to:', newUsername);
            const updates: ProfileUpdateRequest = { username: newUsername };
            const updatedUser = await UserService.updateProfile(updates);
            
            console.log('Username updated successfully');
            showStatus("Username updated successfully!");
            
            currentUsernameInput.value = updatedUser.username;
            newUsernameInput.value = "";
            
        } catch (error) {
            console.error('Failed to update username:', error);
            showStatus("Failed to update username. Please try again.", true);
        } finally {
            setButtonLoading(saveBtn, false);
        }
    });
}

function setupBioHandlers(section: HTMLElement) {
    const saveBtn = section.querySelector("#save_bio") as HTMLButtonElement;
    const newBioInput = section.querySelector("#new_bio") as HTMLTextAreaElement;
    const currentBioInput = section.querySelector("#current_bio") as HTMLTextAreaElement;

    saveBtn.addEventListener("click", async () => {
        const newBio = newBioInput.value.trim();
        
        if (!newBio) {
            showStatus("Please enter a bio", true);
            return;
        }

        setButtonLoading(saveBtn, true);
        
        try {
            console.log('Updating bio to:', newBio);
            const updates: ProfileUpdateRequest = { activityType: newBio };
            await UserService.updateProfile(updates);
            
            console.log('Bio updated successfully');
            showStatus("Bio updated successfully!");
            
            currentBioInput.value = newBio;
            newBioInput.value = "";
            
        } catch (error) {
            console.error('Failed to update bio:', error);
            showStatus("Failed to update bio. Please try again.", true);
        } finally {
            setButtonLoading(saveBtn, false);
        }
    });
}

function setupPasswordHandlers(section: HTMLElement) {
    const saveBtn = section.querySelector("#save_password") as HTMLButtonElement;
    const currentPasswordInput = section.querySelector("#current_password") as HTMLInputElement;
    const newPasswordInput = section.querySelector("#new_password") as HTMLInputElement;
    const confirmPasswordInput = section.querySelector("#confirm_password") as HTMLInputElement;

    saveBtn.addEventListener("click", async () => {
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            showStatus("Please fill in all password fields", true);
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showStatus("New passwords don't match", true);
            return;
        }
        
        if (newPassword.length < 6) {
            showStatus("Password must be at least 6 characters", true);
            return;
        }

        setButtonLoading(saveBtn, true);
        
        try {
            console.log('Updating password...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('Password updated successfully');
            showStatus("Password updated successfully!");
            
            currentPasswordInput.value = "";
            newPasswordInput.value = "";
            confirmPasswordInput.value = "";
            
        } catch (error) {
            console.error('Failed to update password:', error);
            showStatus("Failed to update password. Please try again.", true);
        } finally {
            setButtonLoading(saveBtn, false);
        }
    });
}
/* ---PROBABLY NOT GONING TO BE IMPLEMENTED
function setupAvatarHandlers(section: HTMLElement, currentUser: PublicUser, avatarSelectorContainer: HTMLElement) {
    const saveBtn = section.querySelector("#save_avatar") as HTMLButtonElement;
    const fileInput = document.querySelector("#avatar-file-input") as HTMLInputElement;
    const currentAvatar = section.querySelector("img") as HTMLImageElement;
    const avatarInput = section.querySelector("#new_avatar") as HTMLInputElement;

    // ✅ Store selected file here
    let selectedFile: File | null = null;

    // ✅ Listen for file selection and store it
    fileInput?.addEventListener("change", () => {
        selectedFile = fileInput.files?.[0] || null;
        console.log('📁 File selected:', selectedFile?.name);
    });

    saveBtn.addEventListener("click", async () => {
        // ✅ Check stored file, not fileInput.files
        if (selectedFile) {
            // ✅ FILE UPLOAD MODE
            setButtonLoading(saveBtn, true);
            
            try {
                console.log('🖼️ Uploading avatar file:', selectedFile.name);
                

                console.log('✅ Avatar uploaded successfully');
                showStatus("Avatar uploaded successfully!");
                
                
                
                // Clear stored file and input
                selectedFile = null;
                if (fileInput) fileInput.value = '';
                
            } catch (error) {
                console.error('❌ Failed to upload avatar:', error);
                showStatus(
                    error instanceof Error ? error.message : "Failed to upload avatar",
                    true
                );
            } finally {
                setButtonLoading(saveBtn, false);
            }
            
        } else if (avatarInput?.value && !avatarInput.value.startsWith('data:')) {
            // ✅ PRESET AVATAR MODE
            const newAvatarUrl = avatarInput.value;
            
            setButtonLoading(saveBtn, true);
            
            try {
                console.log('Updating avatar to preset:', newAvatarUrl);
                const updates: ProfileUpdateRequest = { avatarUrl: newAvatarUrl };
                const updatedUser = await UserService.updateProfile(updates);
                
                console.log('Avatar updated successfully');
                showStatus("Avatar updated successfully!");
                
                currentAvatar.src = updatedUser.avatarUrl || agent;
                avatarInput.value = "";
                
                // Clear preset selections
                const avatarOptions = avatarSelectorContainer.querySelector('div');
                if (avatarOptions) {
                    avatarOptions.querySelectorAll(".avatar-option").forEach(a => {
                        (a as HTMLElement).style.border = "2px solid transparent";
                        a.classList.remove("selected");
                    });
                }
                
            } catch (error) {
                console.error('Failed to update avatar:', error);
                showStatus("Failed to update avatar. Please try again.", true);
            } finally {
                setButtonLoading(saveBtn, false);
            }
            
        } else {
            showStatus("Please select a preset avatar or upload a file", true);
        }
    });
}
*/

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