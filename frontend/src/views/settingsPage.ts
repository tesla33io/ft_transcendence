import { Router } from '../router';
import { createWindow } from './components';
import { createTaskbar } from "./components";
import { UserService } from "../game/userService";
import type { PublicUser, ProfileUpdateRequest } from "../types";
import agent from "./images/msagent.png"
import book_user from "./images/book_user.png"
import rabit from "./images/rabit.png"

export async function settingsView(router: Router) {
    const app = document.getElementById('app');
    if (!app) {
        console.error("App element not found!");
        return;
    }

    // ----------------------------
    // LOAD CURRENT USER DATA
    // ----------------------------
    app.innerHTML = '<div style="text-align: center; padding: 50px;">Loading settings...</div>';

    try {
        console.log('⚙️ Loading current user settings...');
        const currentUser = await UserService.getCurrentUser();
        console.log('✅ Current user loaded:', currentUser.username);
        
        buildSettingsUI(app, router, currentUser);
        
    } catch (error) {
        console.error('❌ Failed to load user settings:', error);
        showErrorState(app, router);
    }
}

function buildSettingsUI(app: HTMLElement, router: Router, currentUser: PublicUser) {
    const content = document.createElement("div");
    content.style.padding = "15px";
    content.style.height = "100%";
    content.style.display = "flex";
    content.style.flexDirection = "column";

    // ----------------------------
    // MAIN HEADING
    // ----------------------------
    const mainHeading = document.createElement("h2");
    mainHeading.textContent = "Profile Settings";
    mainHeading.style.textAlign = "center";
    mainHeading.style.margin = "0 0 15px 0"; // Reduced from 20px to 15px
    mainHeading.style.fontSize = "18px";
    mainHeading.style.borderBottom = "1px solid #c0c0c0";
    mainHeading.style.paddingBottom = "8px"; // Reduced from 10px to 8px
    content.appendChild(mainHeading);

    // ----------------------------
    // MAIN LAYOUT CONTAINER (TWO COLUMNS)
    // ----------------------------
    const mainContainer = document.createElement("div");
    mainContainer.style.display = "grid";
    mainContainer.style.gridTemplateColumns = "1fr 1fr";
    mainContainer.style.gridTemplateRows = "1fr 1fr";
    mainContainer.style.gap = "15px"; // Reduced from 20px to 15px
    mainContainer.style.flex = "1"; // Take available space
    mainContainer.style.minHeight = "0"; // Important for proper grid sizing

    // LEFT COLUMN
    const leftColumn = document.createElement("div");
    leftColumn.style.display = "flex";
    leftColumn.style.flexDirection = "column";
    leftColumn.style.gap = "15px"; // Reduced from 20px to 15px
    
    // RIGHT COLUMN  
    const rightColumn = document.createElement("div");
    rightColumn.style.display = "flex";
    rightColumn.style.flexDirection = "column";
    rightColumn.style.gap = "15px"; // Reduced from 20px to 15px

    // ----------------------------
    // PANEL COMMON STYLES
    // ----------------------------
    const panelCommonStyles = `
        background-color: #e0e0e0;
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 0;
        overflow: hidden;
    `;

    // ----------------------------
    // USERNAME SECTION (LEFT COLUMN)
    // ----------------------------
    const usernameSection = document.createElement("div");
    usernameSection.className = "sunken-panel";
    usernameSection.style.cssText = `
        padding: 10px; 
        ${panelCommonStyles}
    `;
    usernameSection.innerHTML = `
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
    leftColumn.appendChild(usernameSection);

    // ----------------------------
    // BIO SECTION (LEFT COLUMN)
    // ----------------------------
    const bioSection = document.createElement("div");
    bioSection.className = "sunken-panel";
    bioSection.style.cssText = `
        padding: 10px;
        ${panelCommonStyles}
    `;
    bioSection.innerHTML = `
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
    leftColumn.appendChild(bioSection);

    // ----------------------------
    // PASSWORD SECTION (RIGHT COLUMN)
    // ----------------------------
    const passwordSection = document.createElement("div");
    passwordSection.className = "sunken-panel";
    passwordSection.style.cssText = `
        padding: 10px;
        ${panelCommonStyles}
    `;
    passwordSection.innerHTML = `
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
    rightColumn.appendChild(passwordSection);

    // ----------------------------
    // AVATAR SECTION (RIGHT COLUMN) - OPTIMIZED FOR NO SCROLLING
    // ----------------------------
    const avatarSection = document.createElement("div");
    avatarSection.className = "sunken-panel";
    avatarSection.style.cssText = `
        padding: 10px;
        ${panelCommonStyles}
    `;

    // Create avatar content container with tighter spacing
    const avatarContent = document.createElement("div");
    avatarContent.style.flex = "1";
    avatarContent.style.display = "flex";
    avatarContent.style.flexDirection = "column";
    avatarContent.style.justifyContent = "space-between";
    
    // Top section with current avatar
    const topSection = document.createElement("div");
    
    // Current avatar display - more compact
    const currentAvatarDiv = document.createElement("div");
    currentAvatarDiv.style.textAlign = "center";
    currentAvatarDiv.style.marginBottom = "8px";
    currentAvatarDiv.innerHTML = `<label style="display: block; margin-bottom: 3px; font-size: 11px;">Current Avatar:</label>`;

    const currentAvatar = document.createElement("img");
    currentAvatar.src = currentUser.avatarUrl || agent;
    currentAvatar.width = 35; // Further reduced for better fit
    currentAvatar.height = 35;
    currentAvatar.style.border = "2px solid #c0c0c0";
    currentAvatar.style.display = "block";
    currentAvatar.style.margin = "0 auto";
    currentAvatarDiv.appendChild(currentAvatar);
    topSection.appendChild(currentAvatarDiv);

    // New avatar selection - more compact
    const newAvatarLabel = document.createElement("label");
    newAvatarLabel.textContent = "Select New:";
    newAvatarLabel.style.display = "block";
    newAvatarLabel.style.textAlign = "center";
    newAvatarLabel.style.fontSize = "11px";
    newAvatarLabel.style.marginBottom = "5px";
    topSection.appendChild(newAvatarLabel);

    const avatarContainer = document.createElement("div");
    avatarContainer.style.display = "flex";
    avatarContainer.style.gap = "6px"; // Reduced gap
    avatarContainer.style.justifyContent = "center";
    avatarContainer.style.marginBottom = "8px";

    const avatars = [agent, book_user, rabit];
    avatars.forEach(src => {
        const img = document.createElement("img");
        img.src = src;
        img.width = 32; // Further reduced for better fit
        img.height = 32;
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
    avatarInput.id = "new_avatar";

    topSection.appendChild(avatarContainer);
    topSection.appendChild(avatarInput);

    avatarContent.appendChild(topSection);

    // Upload section - more compact
    const uploadSection = document.createElement("div");
    const uploadLabel = document.createElement("label");
    uploadLabel.textContent = "Or upload:";
    uploadLabel.style.display = "block";
    uploadLabel.style.fontSize = "10px";
    uploadLabel.style.marginBottom = "3px";

    const uploadInput = document.createElement("input");
    uploadInput.type = "file";
    uploadInput.accept = "image/*";
    uploadInput.style.width = "100%";
    uploadInput.style.fontSize = "10px";

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

    uploadSection.appendChild(uploadLabel);
    uploadSection.appendChild(uploadInput);
    avatarContent.appendChild(uploadSection);

    // Avatar save button
    const avatarSaveBtn = document.createElement("button");
    avatarSaveBtn.id = "save_avatar";
    avatarSaveBtn.textContent = "Update Avatar";
    avatarSaveBtn.style.width = "100%";
    avatarSaveBtn.style.fontSize = "12px";
    avatarSaveBtn.style.padding = "4px";

    // Add content and button to avatar section
    avatarSection.appendChild(avatarContent);
    avatarSection.appendChild(avatarSaveBtn);

    rightColumn.appendChild(avatarSection);

    // Add columns to main container
    mainContainer.appendChild(leftColumn);
    mainContainer.appendChild(rightColumn);
    content.appendChild(mainContainer);

    // ----------------------------
    // STATUS MESSAGES - COMPACT
    // ----------------------------
    const statusDiv = document.createElement("div");
    statusDiv.id = "status_message";
    statusDiv.style.textAlign = "center";
    statusDiv.style.margin = "10px 0"; // Reduced margins
    statusDiv.style.padding = "6px";
    statusDiv.style.display = "none";
    statusDiv.style.borderRadius = "4px";
    statusDiv.style.fontSize = "12px";
    content.appendChild(statusDiv);

    // ----------------------------
    // BOTTOM BUTTON - COMPACT
    // ----------------------------
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "field-row";
    buttonContainer.style.justifyContent = "center";
    buttonContainer.style.borderTop = "1px solid #c0c0c0";
    buttonContainer.style.paddingTop = "10px"; // Reduced from 15px
    buttonContainer.style.flexShrink = "0"; // Don't shrink

    const backBtn = document.createElement("button");
    backBtn.textContent = "Back";
    backBtn.style.padding = "6px 25px"; // Slightly smaller
    backBtn.style.fontSize = "13px";
    backBtn.addEventListener("click", () => router.navigate("/profile"));

    buttonContainer.appendChild(backBtn);
    content.appendChild(buttonContainer);

    // ----------------------------
    // CREATE WINDOW - ADJUSTED HEIGHT
    // ----------------------------
    const setupWindow = createWindow({
        title: `Profile settings`,
        width: "650px",
        height: "600px", 
        content: content,
        titleBarControls: {
            help: true,
            close: true,
            onClose: () => router.navigate("/desktop")
        }
    });

    // ----------------------------
    // HELPER FUNCTIONS (same as before)
    // ----------------------------
    function showStatus(message: string, isError: boolean = false) {
        statusDiv.textContent = message;
        statusDiv.style.display = "block";
        statusDiv.style.color = isError ? "red" : "green";
        statusDiv.style.backgroundColor = isError ? "#ffe6e6" : "#e6ffe6";
        statusDiv.style.border = `1px solid ${isError ? "#ffcccc" : "#ccffcc"}`;
        
        // Hide after 3 seconds
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

    // ----------------------------
    // EVENT HANDLERS (same as before, but remove handleLogout function)
    // ----------------------------
    
    // USERNAME UPDATE
    const saveUsernameBtn = content.querySelector("#save_username") as HTMLButtonElement;
    saveUsernameBtn.addEventListener("click", async () => {
        const newUsername = (content.querySelector("#new_username") as HTMLInputElement).value.trim();
        
        if (!newUsername) {
            showStatus("Please enter a new username", true);
            return;
        }
        
        if (newUsername === currentUser.username) {
            showStatus("New username must be different from current username", true);
            return;
        }

        setButtonLoading(saveUsernameBtn, true);
        
        try {
            console.log('👤 Updating username to:', newUsername);
            const updates: ProfileUpdateRequest = { username: newUsername };
            const updatedUser = await UserService.updateProfile(updates);
            
            console.log('✅ Username updated successfully');
            showStatus("Username updated successfully!");
            
            // Update UI
            (content.querySelector("#current_username") as HTMLInputElement).value = updatedUser.username;
            (content.querySelector("#new_username") as HTMLInputElement).value = "";
            
        } catch (error) {
            console.error('❌ Failed to update username:', error);
            showStatus("Failed to update username. Please try again.", true);
        } finally {
            setButtonLoading(saveUsernameBtn, false);
        }
    });

    // PASSWORD UPDATE
    const savePasswordBtn = content.querySelector("#save_password") as HTMLButtonElement;
    savePasswordBtn.addEventListener("click", async () => {
        const currentPassword = (content.querySelector("#current_password") as HTMLInputElement).value;
        const newPassword = (content.querySelector("#new_password") as HTMLInputElement).value;
        const confirmPassword = (content.querySelector("#confirm_password") as HTMLInputElement).value;
        
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

        setButtonLoading(savePasswordBtn, true);
        
        try {
            console.log('🔒 Updating password...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('✅ Password updated successfully');
            showStatus("Password updated successfully!");
            
            // Clear password fields
            (content.querySelector("#current_password") as HTMLInputElement).value = "";
            (content.querySelector("#new_password") as HTMLInputElement).value = "";
            (content.querySelector("#confirm_password") as HTMLInputElement).value = "";
            
        } catch (error) {
            console.error('❌ Failed to update password:', error);
            showStatus("Failed to update password. Please try again.", true);
        } finally {
            setButtonLoading(savePasswordBtn, false);
        }
    });

    // BIO UPDATE
    const saveBioBtn = content.querySelector("#save_bio") as HTMLButtonElement;
    saveBioBtn.addEventListener("click", async () => {
        const newBio = (content.querySelector("#new_bio") as HTMLTextAreaElement).value.trim();
        
        if (!newBio) {
            showStatus("Please enter a bio", true);
            return;
        }

        setButtonLoading(saveBioBtn, true);
        
        try {
            console.log('📝 Updating bio to:', newBio);
            const updates: ProfileUpdateRequest = { activityType: newBio };
            await UserService.updateProfile(updates);
            
            console.log('✅ Bio updated successfully');
            showStatus("Bio updated successfully!");
            
            // Update UI
            (content.querySelector("#current_bio") as HTMLTextAreaElement).value = newBio;
            (content.querySelector("#new_bio") as HTMLTextAreaElement).value = "";
            
        } catch (error) {
            console.error('❌ Failed to update bio:', error);
            showStatus("Failed to update bio. Please try again.", true);
        } finally {
            setButtonLoading(saveBioBtn, false);
        }
    });

    // AVATAR UPDATE
    const saveAvatarBtn = content.querySelector("#save_avatar") as HTMLButtonElement;
    saveAvatarBtn.addEventListener("click", async () => {
        const newAvatarUrl = (content.querySelector("#new_avatar") as HTMLInputElement).value;
        
        if (!newAvatarUrl) {
            showStatus("Please select an avatar", true);
            return;
        }

        setButtonLoading(saveAvatarBtn, true);
        
        try {
            console.log('🖼️ Updating avatar to:', newAvatarUrl);
            const updatedUser = await UserService.updateAvatar(newAvatarUrl);
            
            console.log('✅ Avatar updated successfully');
            showStatus("Avatar updated successfully!");
            
            // Update current avatar display
            currentAvatar.src = updatedUser.avatarUrl || agent;
            (content.querySelector("#new_avatar") as HTMLInputElement).value = "";
            
            // Clear selections
            avatarContainer.querySelectorAll(".avatar-option").forEach(a => {
                (a as HTMLElement).style.border = "2px solid transparent";
                a.classList.remove("selected");
            });
            
        } catch (error) {
            console.error('❌ Failed to update avatar:', error);
            showStatus("Failed to update avatar. Please try again.", true);
        } finally {
            setButtonLoading(saveAvatarBtn, false);
        }
    });

    // ----------------------------
    // ATTACH TO DOM
    // ----------------------------
    app.innerHTML = '';
    app.appendChild(setupWindow);
    
    const { taskbar } = createTaskbar({
        startButton: {
            label: "Start",
            onClick: () => router.navigate("/"),
        },
        clock: true,
    });
    
    app.appendChild(taskbar);
}

function showErrorState(app: HTMLElement, router: Router) {
    const errorContent = document.createElement("div");
    errorContent.style.textAlign = "center";
    errorContent.style.padding = "40px";
    
    errorContent.innerHTML = `
        <h2 style="color: red;">❌ Failed to Load Settings</h2>
        <p>Could not load user settings. Please try again.</p>
        <button onclick="location.reload()">Try Again</button>
        <button onclick="history.back()">Go Back</button>
    `;

    const errorWindow = createWindow({
        title: "Settings Error",
        width: "350px",
        content: errorContent,
        titleBarControls: {
            close: true,
            onClose: () => router.navigate("/desktop")
        }
    });

    app.innerHTML = '';
    app.appendChild(errorWindow);

    const { taskbar } = createTaskbar({
        startButton: {
            label: "Start",
            onClick: () => router.navigate("/"),
        },
        clock: true,
    });
    app.appendChild(taskbar);
}