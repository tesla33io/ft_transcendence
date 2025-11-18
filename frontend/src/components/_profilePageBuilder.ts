import { Router } from "../router";
import { createWindow, createTaskbar, createStaticDesktopBackground } from "./_components";
import { 
    createOneVOneStatsComponent,
    createMatchHistoryComponent,
    createUserInfoComponent,
    createTournamentStatsComponent,
    createPlayerVsAIStatsComponent
} from "./_userComponents";
import { AvatarService, AVAILABLE_AVATARS, type Avatar } from '../game/avatarConstants';


export interface ProfilePageOptions {
    userId?: number;
    title?: string;
    router: Router;
}

export function createCompleteProfilePage(options: ProfilePageOptions) {
    const { userId, router } = options;
    const isOwnProfile = !userId;
    const windowTitle = options.title || (isOwnProfile ? "My Profile" : "User Profile");

    const root = document.getElementById("app");
    if (!root) {
        console.error("App root element not found!");
        return;
    }
    root.innerHTML = "";

    const staticBackground = createStaticDesktopBackground();
    staticBackground.attachToPage(document.body);

    const content = document.createElement("div");
    content.className = "p-4 flex flex-col gap-2";
    content.style.cssText = `
        height: 100%;
        box-sizing: border-box;
        overflow: hidden;
    `; 
    
    const topRow = document.createElement('div');
    topRow.className = "grid grid-cols-2 gap-2 flex-shrink-0";
    topRow.style.height = "240px"; 

    const middleRow = document.createElement('div');
    middleRow.className = "grid grid-cols-2 gap-2 flex-shrink-0";
    middleRow.style.height = "140px";

    const matchHistoryContainer = document.createElement('div');
    matchHistoryContainer.className = "flex-1 min-h-0 overflow-hidden"; 
    // Create component containers for top row
    const userInfoContainer = document.createElement('div');
    userInfoContainer.className = "col-span-1 bg-gray-200";
    
    const oneVOneStatsContainer = document.createElement('div');
    oneVOneStatsContainer.className = "col-span-1 bg-gray-200";
    
    // Create component containers for middle row
    const tournamentStatsContainer = document.createElement('div');
    tournamentStatsContainer.className = "col-span-1 bg-gray-200";
    
    const playerVsAIContainer = document.createElement('div');
    playerVsAIContainer.className = "col-span-1 bg-gray-200";

    const userInfoComponent = createUserInfoComponent({
        container: userInfoContainer,
        userId: userId,
        width: '100%',
        height: '240px'
    });

    const oneVOneStatsComponent = createOneVOneStatsComponent({
        container: oneVOneStatsContainer,
        userId: userId,
        width: '100%',
        height: '240px',
        showTitle: true
    });

    const tournamentStatsComponent = createTournamentStatsComponent({
        container: tournamentStatsContainer,
        userId: userId,
        width: '100%',
        height: '140px',
        showTitle: true
    });

    const playerVsAIComponent = createPlayerVsAIStatsComponent({
        container: playerVsAIContainer,
        userId: userId,
        width: '100%',
        height: '140px',
        showTitle: true
    });

    const matchHistoryComponent = createMatchHistoryComponent({
        container: matchHistoryContainer,
        userId: userId,
        width: '100%',
        height: '200px', 
        showTitle: true,
    });

    topRow.appendChild(userInfoContainer);
    topRow.appendChild(oneVOneStatsContainer);
    
    middleRow.appendChild(tournamentStatsContainer);
    middleRow.appendChild(playerVsAIContainer);

    content.appendChild(topRow);
    content.appendChild(middleRow);
    content.appendChild(matchHistoryContainer);

    // Create window
    const window = createWindow({
        title: windowTitle,
        width: '900px',
        height: '700px',
        content: content,
        titleBarControls: {
            help: true,
            close: true,
            onClose: () => {
                staticBackground.remove();
                router.navigate('/desktop');
            }
        }
    });

    root.appendChild(window);

    const { taskbar } = createTaskbar({
        startButton: {
            label: "Start",
            onClick: () => {
                staticBackground.remove();
                router.navigate("/");
            }
        },
        clock: true,
    });

    root.appendChild(taskbar);

    return {
        userInfoComponent,
        oneVOneStatsComponent,
        tournamentStatsComponent,
        playerVsAIComponent,
        matchHistoryComponent,
        refreshAll: () => {
            userInfoComponent.refresh();
            oneVOneStatsComponent.refresh();
            tournamentStatsComponent.refresh();
            playerVsAIComponent.refresh();
            matchHistoryComponent.refresh();
        }
    };
}

export function createMyProfilePage(router: Router) {
    return createCompleteProfilePage({
        router,
        title: "👤 My Profile"
    });
}

export function createFriendProfilePage(userId: number, router: Router) {
    return createCompleteProfilePage({
        userId,
        router,
        title: "👥 Friend Profile"
    });
}

import {DEFAULT_AVATAR} from '../game/avatarConstants';

export interface AvatarSelectorConfig {
    showSaveButton?: boolean;
    saveButtonText?: string;
    containerStyle?: string;
    onAvatarChange?: (avatar: Avatar) => void;
}

export class AvatarSelectorComponent {
    private container: HTMLElement;
    private config: AvatarSelectorConfig;
    private selectedAvatarId: string | null = null;
    private saveButton: HTMLButtonElement | null = null;
    private currentAvatarImg: HTMLImageElement | null = null;

    constructor(config: AvatarSelectorConfig = {}) {
        this.config = {
            showSaveButton: true,
            saveButtonText: 'Save Avatar',
            ...config
        };
        this.container = this.createContainer();
        this.render();
    }

    private createContainer(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'avatar-selector-component';
        container.style.cssText = this.config.containerStyle || `
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        return container;
    }

    private render(): void {
        this.container.innerHTML = '';
        
        // Current avatar display
        this.createCurrentAvatarDisplay();
        
        // Avatar selection grid
        this.createAvatarSelectionGrid();
        
        // Save button (if enabled)
        if (this.config.showSaveButton) {
            this.createSaveButton();
        }
    }

    private createCurrentAvatarDisplay(): void {
        const currentAvatarDiv = document.createElement('div');
        currentAvatarDiv.style.cssText = 'text-align: center;';
        
        const label = document.createElement('label');
        label.textContent = 'Current Avatar:';
        label.style.cssText = 'display: block; margin-bottom: 5px; font-size: 11px;';
        
        this.currentAvatarImg = document.createElement('img');
        this.currentAvatarImg.width = 50;
        this.currentAvatarImg.height = 50;
        this.currentAvatarImg.style.cssText = `
            border: 2px solid #c0c0c0;
            display: block;
            margin: 0 auto;
            border-radius: 4px;
        `;
        
        // Set initial avatar from localStorage
        const currentAvatar = AvatarService.getSelectedAvatar();
        this.currentAvatarImg.src = currentAvatar.imagePath;
        
        currentAvatarDiv.appendChild(label);
        currentAvatarDiv.appendChild(this.currentAvatarImg);
        this.container.appendChild(currentAvatarDiv);
    }

    private createAvatarSelectionGrid(): void {
        const selectLabel = document.createElement('label');
        selectLabel.textContent = 'Select New Avatar:';
        selectLabel.style.cssText = `
            display: block;
            text-align: center;
            font-size: 11px;
            margin-bottom: 5px;
        `;
        
        const avatarContainer = document.createElement('div');
        avatarContainer.className = 'avatar-grid';
        avatarContainer.style.cssText = `
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-bottom: 10px;
            flex-wrap: wrap;
        `;

        AVAILABLE_AVATARS.forEach((avatar) => {
            const avatarWrapper = this.createAvatarOption(avatar, avatarContainer);
            avatarContainer.appendChild(avatarWrapper);
        });

        this.container.appendChild(selectLabel);
        this.container.appendChild(avatarContainer);
    }

    private createAvatarOption(avatar: Avatar, container: HTMLElement): HTMLElement {
        const avatarWrapper = document.createElement('div');
        avatarWrapper.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            cursor: pointer;
        `;

        const img = document.createElement('img');
        img.src = avatar.imagePath;
        img.width = 45;
        img.height = 45;
        img.style.cssText = `
            border: 3px solid transparent;
            border-radius: 4px;
            transition: border-color 0.2s;
        `;
        img.classList.add('avatar-option');
        img.dataset.avatarId = avatar.id;

        const label = document.createElement('span');
        label.textContent = avatar.name;
        label.style.cssText = 'font-size: 9px; color: #333;';

        avatarWrapper.addEventListener('click', () => {
            this.selectAvatar(avatar, img, container);
        });

        avatarWrapper.appendChild(img);
        avatarWrapper.appendChild(label);
        return avatarWrapper;
    }

    private createSaveButton(): void {
        this.saveButton = document.createElement('button');
        this.saveButton.textContent = this.config.saveButtonText!;
        this.saveButton.style.cssText = 'width: 100%;';
        
        this.saveButton.addEventListener('click', () => this.handleSave());
        
        this.container.appendChild(this.saveButton);
    }

    private selectAvatar(avatar: Avatar, imgElement: HTMLImageElement, container: HTMLElement): void {
        // Clear previous selection
        container.querySelectorAll('.avatar-option').forEach(option => {
            (option as HTMLElement).style.borderColor = 'transparent';
            option.classList.remove('selected');
        });
        
        // Mark as selected
        imgElement.style.borderColor = '#0000ff';
        imgElement.classList.add('selected');
        this.selectedAvatarId = avatar.id;
        
        // Update current avatar preview
        if (this.currentAvatarImg) {
            this.currentAvatarImg.src = avatar.imagePath;
        }

        // Trigger callback if provided
        if (this.config.onAvatarChange) {
            this.config.onAvatarChange(avatar);
        }
    }

    private handleSave(): void {
        if (!this.selectedAvatarId) {
            this.showStatus('Please select an avatar', true);
            return;
        }

        this.setButtonLoading(true);

        try {
            // Save to localStorage
            AvatarService.saveSelectedAvatar(this.selectedAvatarId);
            this.showStatus('Avatar saved!');
            
            // Clear selection
            this.clearSelection();
            
        } catch (error) {
            console.error('Failed to save avatar:', error);
            this.showStatus('Failed to save avatar. Please try again.', true);
        } finally {
            this.setButtonLoading(false);
        }
    }

    private clearSelection(): void {
        this.selectedAvatarId = null;
        this.container.querySelectorAll('.avatar-option').forEach(option => {
            (option as HTMLElement).style.borderColor = 'transparent';
            option.classList.remove('selected');
        });
    }

    private setButtonLoading(loading: boolean): void {
        if (!this.saveButton) return;
        
        if (loading) {
            this.saveButton.disabled = true;
            this.saveButton.dataset.originalText = this.saveButton.textContent || '';
            this.saveButton.textContent = 'Saving...';
        } else {
            this.saveButton.disabled = false;
            this.saveButton.textContent = this.saveButton.dataset.originalText || this.config.saveButtonText!;
        }
    }

    private showStatus(message: string, isError: boolean = false): void {
        // Try to find an existing status div
        let statusDiv = document.getElementById('status_message');
        
        if (!statusDiv) {
            // Create a temporary status div
            statusDiv = document.createElement('div');
            statusDiv.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 9999;
                padding: 10px 20px;
                border-radius: 4px;
                font-size: 12px;
                text-align: center;
                min-width: 200px;
                background-color: ${isError ? '#ffe6e6' : '#e6ffe6'};
                border: 1px solid ${isError ? '#ffcccc' : '#ccffcc'};
                color: ${isError ? 'red' : 'green'};
            `;
            document.body.appendChild(statusDiv);
            
            // Remove after delay
            setTimeout(() => {
                if (statusDiv && statusDiv.parentNode) {
                    statusDiv.parentNode.removeChild(statusDiv);
                }
            }, 3000);
        }
        
        statusDiv.textContent = message;
        statusDiv.style.display = 'block';
        
        if (statusDiv.id === 'status_message') {
            statusDiv.style.color = isError ? 'red' : 'green';
            statusDiv.style.backgroundColor = isError ? '#ffe6e6' : '#e6ffe6';
            statusDiv.style.border = `1px solid ${isError ? '#ffcccc' : '#ccffcc'}`;
            
            setTimeout(() => {
                statusDiv!.style.display = 'none';
            }, 3000);
        }
    }

    // Public methods
    public getElement(): HTMLElement {
        return this.container;
    }

    public getSelectedAvatarId(): string | null {
        return this.selectedAvatarId;
    }
}

// Helper function to create avatar display (for showing avatars anywhere)
export function createAvatarDisplay(size: 'small' | 'medium' | 'large' = 'medium'): HTMLElement {
    const avatar = AvatarService.getSelectedAvatar();
    
    const sizes = {
        small: { width: '24px', height: '24px' },
        medium: { width: '48px', height: '48px' },
        large: { width: '64px', height: '64px' }
    };

    const container = document.createElement('div');
    container.className = `avatar-display avatar-display-${size}`;
    container.style.cssText = `
        display: inline-block;
        width: ${sizes[size].width};
        height: ${sizes[size].height};
    `;
    
    const img = document.createElement('img');
    img.src = avatar.imagePath;
    img.alt = avatar.name;
    img.title = avatar.name;
    img.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: contain;
        border: 1px solid #c0c0c0;
        border-radius: 4px;
    `;
    img.onerror = () => {
        img.src = DEFAULT_AVATAR.imagePath;
    };

    container.appendChild(img);
    return container;
}

// Helper function for quick component creation
export function createAvatarSelector(config: AvatarSelectorConfig = {}): AvatarSelectorComponent {
    return new AvatarSelectorComponent(config);
}