// For friends component

import { UserService } from '../game/userService';
import { createWindow } from '../components/_components';
import type { Friend, FriendRequest } from '../game/userService';
import type {
    OneVOneStatistics,
    PlayerVsAIStatistics,
    TournamentStatistics,
    MatchHistoryEntry,
    UserProfile
} from '../game/userService';


function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

function createStatusMessage(): HTMLElement {
    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = `
        padding: 6px; text-align: center; font-size: 11px; display: none;
        border-radius: 3px; margin-top: 10px;
    `;
    return statusDiv;
}

function showStatus(statusDiv: HTMLElement, message: string, isError: boolean = false) {
    statusDiv.textContent = message;
    statusDiv.style.display = 'block';
    statusDiv.style.backgroundColor = isError ? '#ffcccc' : '#ccffcc';
    statusDiv.style.color = isError ? '#cc0000' : '#006600';
    statusDiv.style.border = `1px solid ${isError ? '#cc9999' : '#99cc99'}`;
    setTimeout(() => statusDiv.style.display = 'none', 3000);
}

// ===========================
// FRIENDS COMPONENT
// ===========================
export interface FriendsComponentOptions {
    container: HTMLElement;
    height?: string;
    width?: string;
    showTitle?: boolean;
    onFriendSelect?: (friend: Friend) => void;
    onError?: (error: string) => void;
}

export class FriendsComponent {
    private container: HTMLElement;
    private options: FriendsComponentOptions;
    private friends: Friend[] = [];
    private selectedFriend: Friend | null = null;

    constructor(options: FriendsComponentOptions) {
        this.container = options.container;
        this.options = { height: '200px', width: '300px', showTitle: true, ...options };
        this.init();
    }

    private async init() {
        this.showLoading();
        try {
            this.friends = await UserService.getFriends();
            this.render();
        } catch (error) {
            this.showError(error instanceof Error ? error.message : 'Failed to load friends');
        }
    }

    private showLoading() {
        this.container.innerHTML = '';
        this.container.className = 'sunken-panel';
        this.container.style.cssText = this.getContainerStyle();
        this.container.innerHTML = `
            <div style="color: #666; font-size: 11px; text-align: center; display: flex; align-items: center; justify-content: center; height: 100%;">
                ⏳ Loading friends...
            </div>
        `;
    }

    private showError(message: string) {
        this.container.innerHTML = `
            <div style="color: #cc0000; font-size: 10px; text-align: center; display: flex; align-items: center; justify-content: center; height: 100%;">
                ❌ ${message}
            </div>
        `;
    }

    private getContainerStyle(): string {
        return `
            height: ${this.options.height}; width: ${this.options.width};
            padding: 8px; background-color: #e0e0e0; overflow: hidden;
            display: flex; flex-direction: column;
        `;
    }

    private render() {
        this.container.innerHTML = '';
        this.container.className = 'sunken-panel';
        this.container.style.cssText = this.getContainerStyle();

        if (this.options.showTitle) {
            const title = document.createElement('h4');
            title.textContent = `Friends (${this.friends.length})`;
            title.style.cssText = `
                margin: 0 0 8px 0; font-size: 12px; font-weight: bold;
                text-align: center; color: #000080; flex-shrink: 0;
            `;
            this.container.appendChild(title);
        }

        const tableContainer = document.createElement('div');
        tableContainer.style.cssText = `flex: 1; overflow-y: auto; border: 1px inset #c0c0c0;`;

        const table = document.createElement('table');
        table.className = 'interactive';
        table.style.cssText = `
            width: 100%; border-collapse: collapse; font-size: 11px; background-color: white;
        `;

        table.innerHTML = `
            <thead>
                <tr>
                    <th style="padding: 4px; border-bottom: 1px solid #c0c0c0; background-color: #e0e0e0; text-align: left;">Name</th>
                    <th style="padding: 4px; border-bottom: 1px solid #c0c0c0; background-color: #e0e0e0; text-align: center; width: 60px;">Status</th>
                    <th style="padding: 4px; border-bottom: 1px solid #c0c0c0; background-color: #e0e0e0; text-align: center; width: 80px;">Last Online</th>
                </tr>
            </thead>
        `;

        const tbody = document.createElement('tbody');

        if (this.friends.length === 0) {
            tbody.innerHTML = `
                <tr><td colspan="3" style="padding: 20px; text-align: center; color: #666;">
                    No friends yet. Add some friends to see them here!
                </td></tr>
            `;
        } else {
            this.friends.forEach(friend => {
                const row = document.createElement('tr');
                row.style.cursor = 'pointer';
                row.dataset.userId = friend.userId.toString();
                row.innerHTML = `
                    <td style="padding: 4px 6px; border-bottom: 1px solid #f0f0f0;">
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <img src="${friend.avatarUrl || '/images/default-avatar.png'}" width="16" height="16" style="border-radius: 2px;">
                            <span>${friend.userName}</span>
                        </div>
                    </td>
                    <td style="padding: 4px; border-bottom: 1px solid #f0f0f0; text-align: center;">
                        ${friend.isOnline ? '🟢' : '🔴'}
                    </td>
                    <td style="padding: 4px; border-bottom: 1px solid #f0f0f0; text-align: center; font-size: 10px;">
                        ${friend.isOnline ? 'Now' : formatTimeAgo(friend.lastOnlineAt)}
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        table.appendChild(tbody);
        tableContainer.appendChild(table);
        this.container.appendChild(tableContainer);

        // Add click handler
        table.addEventListener('click', (e) => {
            const row = (e.target as Element).closest('tr');
            if (!row || !row.dataset.userId) return;

            // Clear previous selection
            tbody.querySelectorAll('tr').forEach(r => r.classList.remove('highlighted'));
            row.classList.add('highlighted');

            // Find and set selected friend
            const userId = parseInt(row.dataset.userId);
            this.selectedFriend = this.friends.find(f => f.userId === userId) || null;
            if (this.selectedFriend && this.options.onFriendSelect) {
                this.options.onFriendSelect(this.selectedFriend);
            }
        });
    }

    public async refresh() {
        await this.init();
    }

    public getSelectedFriend(): Friend | null {
        return this.selectedFriend;
    }
}

// ===========================
// FRIEND REQUEST WINDOWS
// ===========================
export function createSendFriendRequestWindow(options: { onSend?: (username: string) => Promise<void>; onClose?: () => void } = {}): HTMLElement {
    const content = document.createElement('div');
    content.style.padding = '15px';

    content.innerHTML = `
        <label for="friendUsername" style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px;">
            Enter username:
        </label>
        <input type="text" id="friendUsername" placeholder="Username to add..."
               style="width: 100%; padding: 4px; box-sizing: border-box; font-size: 12px; margin-bottom: 10px;"
               maxlength="30">
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button id="sendBtn" style="padding: 6px 12px; font-size: 12px;">Send Request</button>
            <button id="cancelBtn" style="padding: 6px 12px; font-size: 12px;">Cancel</button>
        </div>
    `;

    const statusDiv = createStatusMessage();
    content.appendChild(statusDiv);

    const window = createWindow({
        title: 'Send Friend Request',
        width: '300px',
        height: '180px',
        content,
        titleBarControls: { close: true, onClose: () => { options.onClose?.(); window.remove(); } }
    });

    const input = content.querySelector('#friendUsername') as HTMLInputElement;
    const sendBtn = content.querySelector('#sendBtn') as HTMLButtonElement;
    const cancelBtn = content.querySelector('#cancelBtn') as HTMLButtonElement;

    sendBtn.onclick = async () => {
        const username = input.value.trim();
        if (!username) return showStatus(statusDiv, 'Please enter a username', true);

        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending...';

        try {
            if (options.onSend) {
                await options.onSend(username);
            } else {
                const result = await UserService.sendFriendRequest(username);
                if (result.success) {
                    showStatus(statusDiv, result.message);
                    input.value = '';
                } else {
                    showStatus(statusDiv, result.message, true);
                }
            }
        } catch (error) {
            showStatus(statusDiv, 'Failed to send request. Please try again.', true);
        } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send Request';
        }
    };

    cancelBtn.onclick = () => { options.onClose?.(); window.remove(); };
    input.onkeypress = (e) => { if (e.key === 'Enter') sendBtn.click(); };
    setTimeout(() => input.focus(), 100);

    return window;
}

export function createIncomingRequestsWindow(options: {
    onAccept?: (username: string) => Promise<void>;
    onReject?: (username: string) => Promise<void>;
    onClose?: () => void
} = {}): HTMLElement {
    const content = document.createElement('div');
    content.style.cssText = `padding: 10px; display: flex; flex-direction: column; height: 100%;`;

    const title = document.createElement('h4');
    title.textContent = 'Incoming Friend Requests';
    title.style.cssText = `margin: 0 0 10px 0; font-size: 13px; text-align: center; color: #000080;`;

    const requestsContainer = document.createElement('div');
    requestsContainer.className = 'sunken-panel';
    requestsContainer.style.cssText = `
        flex: 1; background-color: #ffffff; padding: 8px; overflow-y: auto; min-height: 200px;
    `;
    requestsContainer.textContent = '⏳ Loading requests...';

    content.appendChild(title);
    content.appendChild(requestsContainer);

    const window = createWindow({
        title: 'Friend Requests',
        width: '400px',
        height: '300px',
        content,
        titleBarControls: { close: true, onClose: () => { options.onClose?.(); window.remove(); } }
    });

    // Load requests
    UserService.getFriendRequests().then(requests => {
        if (requests.length === 0) {
            requestsContainer.innerHTML = `
                <div style="text-align: center; color: #666; font-size: 12px; padding: 30px;">
                     No incoming friend requests
                </div>
            `;
            return;
        }

        requestsContainer.innerHTML = '';
        requests.forEach(request => {
            const div = document.createElement('div');
            div.className = 'sunken-panel';
            div.style.cssText = `
                margin-bottom: 10px; padding: 12px; background-color: #f0f0f0;
                display: flex; align-items: center; justify-content: space-between; gap: 12px;
            `;

            div.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                    <img src="${request.avatarUrl || '/images/default-avatar.png'}" width="32" height="32"
                         style="border-radius: 3px; border: 1px solid #c0c0c0;">
                    <div>
                        <div style="font-weight: bold; font-size: 13px;">${request.userName}</div>
                        <div style="font-size: 10px; color: #666;">Sent ${formatTimeAgo(request.requestSendDate)}</div>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <button class="accept-btn" style="padding: 4px 12px; font-size: 11px; background-color: #90EE90; border: 1px solid #228B22;">✓ Accept</button>
                    <button class="reject-btn" style="padding: 4px 12px; font-size: 11px; background-color: #FFB6C1; border: 1px solid #DC143C;">✗ Decline</button>
                </div>
            `;

            const acceptBtn = div.querySelector('.accept-btn') as HTMLButtonElement;
            const rejectBtn = div.querySelector('.reject-btn') as HTMLButtonElement;

            acceptBtn.onclick = async () => {
                acceptBtn.disabled = rejectBtn.disabled = true;
                acceptBtn.textContent = 'Accepting...';
                try {
                    await (options.onAccept ? options.onAccept(request.userName) : UserService.acceptFriendRequest(request.userName));
                    div.innerHTML = `<div style="text-align: center; padding: 15px; color: #006600;">✅ ${request.userName} added to friends!</div>`;
                    setTimeout(() => div.remove(), 2000);
                } catch (error) {
                    acceptBtn.textContent = 'Failed';
                    setTimeout(() => {
                        acceptBtn.textContent = '✓ Accept';
                        acceptBtn.disabled = rejectBtn.disabled = false;
                    }, 2000);
                }
            };

            rejectBtn.onclick = async () => {
                acceptBtn.disabled = rejectBtn.disabled = true;
                rejectBtn.textContent = 'Declining...';
                try {
                    await (options.onReject ? options.onReject(request.userName) : UserService.rejectFriendRequest(request.userName));
                    div.innerHTML = `<div style="text-align: center; padding: 15px; color: #cc0000;">❌ Request from ${request.userName} declined</div>`;
                    setTimeout(() => div.remove(), 2000);
                } catch (error) {
                    rejectBtn.textContent = ' Failed';
                    setTimeout(() => {
                        rejectBtn.textContent = 'Decline';
                        acceptBtn.disabled = rejectBtn.disabled = false;
                    }, 2000);
                }
            };

            requestsContainer.appendChild(div);
        });
    }).catch(() => {
        requestsContainer.innerHTML = `<div style="text-align: center; color: #cc0000; font-size: 11px; padding: 20px;">❌ Failed to load friend requests</div>`;
    });

    return window;
}

// ===========================
// FRIENDS ACTIONS COMPONENT
// ===========================
export interface SimpleFriendsActionsOptions {
    container: HTMLElement;
    selectedFriend?: Friend | null;
    onRefreshFriends?: () => void;
    onViewProfile?: (friend: Friend) => void;
}

export class SimpleFriendsActionsComponent {
    private container: HTMLElement;
    private selectedFriend: Friend | null = null;
    private onRefreshFriends?: () => void;
    private onViewProfile?: (friend: Friend) => void;

    constructor(options: SimpleFriendsActionsOptions) {
        this.container = options.container;
        this.selectedFriend = options.selectedFriend || null;
        this.onRefreshFriends = options.onRefreshFriends;
        this.onViewProfile = options.onViewProfile;
        this.render();
    }

    public updateSelectedFriend(friend: Friend | null) {
        this.selectedFriend = friend;
        this.updateDisplay();
    }

    private render() {
        this.container.className = 'sunken-panel';
        this.container.style.cssText = `
            padding: 10px; background-color: #e0e0e0; width: 180px; height: 350px;
            display: flex; flex-direction: column; gap: 8px;
        `;

        this.container.innerHTML = `
            <h4 style="margin: 0 0 10px 0; font-size: 12px; text-align: center; border-bottom: 1px solid #c0c0c0; padding-bottom: 5px;">
                Friend Management
            </h4>
            <div id="selectedFriendInfo" style="
                padding: 10px; background-color: #f0f0f0; border: 1px inset #c0c0c0; margin-bottom: 15px;
                min-height: 60px; font-size: 11px; display: flex; align-items: center; justify-content: center; color: #666;
            ">No friend selected</div>
        `;

        const buttonStyle = `
            width: 100%; padding: 8px 10px; font-size: 11px; text-align: center;
            margin-bottom: 4px; display: flex; align-items: center; justify-content: center; gap: 4px;
        `;

        const buttons = [
            { text: 'View Profile', action: 'view_profile', requiresSelection: true },
            { text: 'Send Friend Request', action: 'send_friend_request', requiresSelection: false },
            { text: 'incoming Friend Requests', action: 'invite', requiresSelection: false },
            { text: 'Refresh Friends List', action: 'refresh_friends_list', requiresSelection: false }
        ];

        buttons.forEach(({ text, action, requiresSelection }) => {
            const btn = document.createElement('button');
            btn.textContent = text;
            btn.style.cssText = buttonStyle;
            btn.dataset.action = action;
            btn.dataset.requiresSelection = requiresSelection.toString();
            this.container.appendChild(btn);
        });

        this.container.onclick = (e) => {
            const btn = e.target as HTMLButtonElement;
            if (btn.tagName !== 'BUTTON') return;

            switch (btn.dataset.action) {
                case 'view_profile':
                    if (this.selectedFriend) {
                        this.onViewProfile?.(this.selectedFriend);
                    }
                    break;
                case 'send_friend_request':
                    document.body.appendChild(createSendFriendRequestWindow({
                        onClose: () => this.onRefreshFriends?.()
                    }));
                    break;
                case 'invite':
                    document.body.appendChild(createIncomingRequestsWindow({
                        onAccept: async (username) => {
                            await UserService.acceptFriendRequest(username);
                            this.onRefreshFriends?.();
                        }
                    }));
                    break;
                case 'refresh_friends_list':
                    this.onRefreshFriends?.();
                    break;
            }
        };

        this.updateDisplay();
    }

    private updateDisplay() {
        const friendInfo = this.container.querySelector('#selectedFriendInfo') as HTMLElement;
        const buttons = this.container.querySelectorAll('button');

        if (this.selectedFriend) {
            friendInfo.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
                    <img src="${this.selectedFriend.avatarUrl || '/images/default-avatar.png'}" width="24" height="24" style="border-radius: 2px;">
                    <div style="flex: 1;">
                        <div style="font-weight: bold; font-size: 12px;">${this.selectedFriend.userName}</div>
                        <div style="font-size: 10px; color: ${this.selectedFriend.isOnline ? '#006600' : '#666'};">
                            ${this.selectedFriend.isOnline ? '🟢 Online' : '🔴 Offline'}
                        </div>
                    </div>
                </div>
            `;
        } else {
            friendInfo.innerHTML = `
                <div style="text-align: center; color: #666;">
                    No friend selected<br><small style="font-size: 10px;">Click on a friend to see their info</small>
                </div>
            `;
        }

        buttons.forEach(btn => {
            const requiresSelection = btn.dataset.requiresSelection === 'true';
            if (requiresSelection) {
                btn.disabled = !this.selectedFriend;
                btn.style.opacity = this.selectedFriend ? '1' : '0.5';
                btn.style.cursor = this.selectedFriend ? 'pointer' : 'not-allowed';
            }
        });
    }
}

// Helper functions
export const createFriendsComponent = (options: FriendsComponentOptions) => new FriendsComponent(options);
export const createSimpleFriendsActionsComponent = (options: SimpleFriendsActionsOptions) => new SimpleFriendsActionsComponent(options);


//profile components

// 1v1 Statistics Component
export interface OneVOneStatsComponentOptions {
    container: HTMLElement;
    userId?: number; // If not provided, shows current user stats
    width?: string;
    height?: string;
    showTitle?: boolean;
}

export class OneVOneStatsComponent {
    private container: HTMLElement;
    private options: OneVOneStatsComponentOptions;
    private stats: OneVOneStatistics | null = null;
    private loading = false;

    constructor(options: OneVOneStatsComponentOptions) {
        this.container = options.container;
        this.options = {
            width: '280px',
            height: '200px',
            showTitle: true,
            ...options
        };

        this.init();
    }

    private async init() {
        this.loading = true;
        this.showLoading();

        try {
            this.stats = await UserService.getOneVOneStatistics(this.options.userId);
            this.loading = false;
			this.render();
        } catch (error) {
            // console.error('Failed to load 1v1 statistics:', error);
            // this.showError('Failed to load 1v1 statistics');
			this.loading = false;
        }
    }

    private showLoading() {
        this.container.innerHTML = '';
        this.container.className = 'sunken-panel';
        this.container.style.cssText = this.getContainerStyle();

        this.container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; font-size: 11px;">
                ⏳ Loading 1v1 stats...
            </div>
        `;
    }

    private showError(message: string) {
        this.container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #cc0000; font-size: 11px; text-align: center;">
                ❌ ${message}
            </div>
        `;
    }

    private getContainerStyle(): string {
        return `
            width: ${this.options.width};
            height: ${this.options.height};
            padding: 8px;
            background-color: #e0e0e0;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;
    }

    private render() {
        if (!this.stats) return;

        this.container.innerHTML = '';
        this.container.className = 'sunken-panel';
        this.container.style.cssText = this.getContainerStyle();

        // Title
        if (this.options.showTitle) {
            const title = document.createElement('h4');
            title.textContent = '1v1 Statistics';
            title.style.cssText = `
                margin: 0 0 10px 0;
                font-size: 24px;
                font-weight: bold;
                text-align: center;
                color: #1e40af;
                border-bottom: 1px solid #c0c0c0;
                padding-bottom: 4px;
                flex-shrink: 0;
            `;
            this.container.appendChild(title);
        }

        // Stats content
        const content = document.createElement('div');
        content.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 6px;
            font-size: 11px;
        `;

        // Win/Loss record
        const recordDiv = document.createElement('div');
        recordDiv.className = 'field-row';
        recordDiv.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 4px 6px;
            background-color: #f0f0f0;
            border: 1px inset #c0c0c0;
            margin-bottom: 4px;
        `;

        const totalGames = this.stats.gamesWon + this.stats.gamesLost;
        recordDiv.innerHTML = `
            <div style="font-weight: bold;">Record:</div>
            <div>${this.stats.gamesWon}W - ${this.stats.gamesLost}L (${totalGames} total)</div>
        `;

        // Win percentage with visual bar
        const winPercentDiv = document.createElement('div');
        winPercentDiv.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 2px;
            margin-bottom: 4px;
        `;

        const winPercentLabel = document.createElement('div');
        winPercentLabel.style.cssText = `
            display: flex;
            justify-content: space-between;
            font-weight: bold;
        `;
        winPercentLabel.innerHTML = `
            <span>Win Rate:</span>
            <span>${this.stats.winPercentage}%</span>
        `;

        const winPercentBar = document.createElement('div');
        winPercentBar.style.cssText = `
            height: 12px;
            background-color: #ffffff;
            border: 1px inset #c0c0c0;
            position: relative;
            overflow: hidden;
        `;

        const winPercentFill = document.createElement('div');
        winPercentFill.style.cssText = `
            height: 100%;
            background: linear-gradient(to right, #90EE90, #228B22);
            width: ${this.stats.winPercentage}%;
            transition: width 0.5s ease-in-out;
        `;

        winPercentBar.appendChild(winPercentFill);
        winPercentDiv.appendChild(winPercentLabel);
        winPercentDiv.appendChild(winPercentBar);

        // Rating section (if available)
        let ratingDiv = null;
        if (this.stats.currentRating && this.stats.peakRating) {
            ratingDiv = document.createElement('div');
            ratingDiv.style.cssText = `
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 4px;
                margin-bottom: 4px;
            `;

            ratingDiv.innerHTML = `
                <div style="text-align: center; padding: 4px; background-color: #f0f0f0; border: 1px inset #c0c0c0;">
                    <div style="font-size: 10px; color: #666;">Current ELO</div>
                    <div style="font-weight: bold; color: #000080;">${this.stats.currentRating}</div>
                </div>
                <div style="text-align: center; padding: 4px; background-color: #f0f0f0; border: 1px inset #c0c0c0;">
                    <div style="font-size: 10px; color: #666;">Peak ELO</div>
                    <div style="font-weight: bold; color: #8B0000;">${this.stats.peakRating}</div>
                </div>
            `;
        }

        // Streak section
        const streakDiv = document.createElement('div');
        streakDiv.style.cssText = `
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px;
        `;

        const currentStreakColor = this.stats.currentWinStreak > 0 ? '#006600' : '#cc0000';
        const currentStreakText = this.stats.currentWinStreak > 0 ?
            `${this.stats.currentWinStreak} wins` :
            `${Math.abs(this.stats.currentWinStreak)} losses`;

        streakDiv.innerHTML = `
            <div style="text-align: center; padding: 4px; background-color: #f0f0f0; border: 1px inset #c0c0c0;">
                <div style="font-size: 10px; color: #666;">Current Streak</div>
                <div style="font-weight: bold; color: ${currentStreakColor};">${currentStreakText}</div>
            </div>
            <div style="text-align: center; padding: 4px; background-color: #f0f0f0; border: 1px inset #c0c0c0;">
                <div style="font-size: 10px; color: #666;">Best Streak</div>
                <div style="font-weight: bold; color: #8B4513;">${this.stats.longestWinStreak} wins</div>
            </div>
        `;

        // Append all elements
        content.appendChild(recordDiv);
        content.appendChild(winPercentDiv);
        if (ratingDiv) content.appendChild(ratingDiv);
        content.appendChild(streakDiv);

        this.container.appendChild(content);
    }

    // Public methods
    public async refresh() {
        await this.init();
    }

    public getStats(): OneVOneStatistics | null {
        return this.stats;
    }
}

// ===========================
// MATCH HISTORY COMPONENT
// ===========================
export interface MatchHistoryComponentOptions {
    container: HTMLElement;
    userId?: number;
    width?: string;
    height?: string;
    showTitle?: boolean;
}

export class MatchHistoryComponent {
    private container: HTMLElement;
    private options: MatchHistoryComponentOptions;
    private matches: MatchHistoryEntry[] = [];
    private loading = false;

    constructor(options: MatchHistoryComponentOptions) {
        this.container = options.container;
        this.options = {
            width: '100%',
            height: '250px',
            showTitle: true,
            ...options
        };
        this.init();
    }

    private async init() {
        this.loading = true;
        this.showLoading();

        try {
            this.matches = await UserService.getMatchHistory(this.options.userId);
            this.loading = false;
			this.render();
        } catch (error) {
            console.error('Failed to load match history:', error);
            this.showError('Failed to load match history');
			this.loading = false;
		}
    }

    private showLoading() {
        this.container.innerHTML = '';
        this.container.className = 'sunken-panel bg-gray-100 p-2 flex items-center justify-center';
        this.container.style.cssText = `width: ${this.options.width}; height: ${this.options.height};`;
        this.container.innerHTML = `
            <div class="text-gray-600 text-xs">⏳ Loading match history...</div>
        `;
    }

    private showError(message: string) {
        this.container.innerHTML = `
            <div class="flex items-center justify-center h-full text-red-600 text-xs text-center">
                ❌ ${message}
            </div>
        `;
    }

    private render() {
        if (this.loading) return;

        this.container.innerHTML = '';
        this.container.className = 'sunken-panel bg-gray-300 p-2 flex flex-col overflow-hidden';
        this.container.style.cssText = `
        width: ${this.options.width};
        height: ${this.options.height};
        background-color: #e0e0e0;
        padding: 12px;
    `;
        // Title
        if (this.options.showTitle) {
            const title = document.createElement('h4');
            title.textContent = 'Match History';
            title.className = 'text-xs font-bold text-center text-blue-800 border-b border-gray-500 pb-1 mb-2 flex-shrink-0';
            this.container.appendChild(title);
        }

        if (this.matches.length === 0) {
            const noMatches = document.createElement('div');
            noMatches.className = 'flex-1 flex items-center justify-center text-gray-600 text-xs';
            noMatches.textContent = 'No matches played yet';
            this.container.appendChild(noMatches);
            return;
        }

        // Match list table
        const table = document.createElement('table');
        table.className = 'w-full text-xs bg-white border border-gray-400';
        table.style.fontSize = '10px';

        // Table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr class="bg-gray-100">
                <th class="p-1 border-b border-gray-400 text-left">Opponent</th>
                <th class="p-1 border-b border-gray-400 text-center w-16">Result</th>
                <th class="p-1 border-b border-gray-400 text-center w-16">Score</th>
                <th class="p-1 border-b border-gray-400 text-center w-12">ELO</th>
                <th class="p-1 border-b border-gray-400 text-center w-16">Date</th>
            </tr>
        `;

        // Table body
        const tbody = document.createElement('tbody');
        this.matches.forEach((match, index) => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-100 cursor-pointer';

            const resultColor = match.isWin ? 'text-green-600' : 'text-red-600';
            const resultIcon = match.isWin ? '✓' : '✗';
            const eloColor = match.eloGained >= 0 ? 'text-green-600' : 'text-red-600';
            const eloText = match.eloGained >= 0 ? `+${match.eloGained}` : `${match.eloGained}`;

            row.innerHTML = `
                <td class="p-1 border-b border-gray-100">
                    <div class="flex items-center gap-1">
                        <span class="font-medium">${match.opponentName}</span>
                    </div>
                </td>
                <td class="p-1 border-b border-gray-100 text-center">
                    <span class="font-bold ${resultColor}">${resultIcon}</span>
                </td>
                <td class="p-1 border-b border-gray-100 text-center">
                    <span class="font-medium">${match.userScore}-${match.opponentScore}</span>
                </td>
                <td class="p-1 border-b border-gray-100 text-center">
                    <span class="font-bold ${eloColor}">${eloText}</span>
                </td>
                <td class="p-1 border-b border-gray-100 text-center text-gray-600">
                    ${formatTimeAgo(match.date)}
                </td>
            `;

            tbody.appendChild(row);
        });

        table.appendChild(thead);
        table.appendChild(tbody);

        // Scrollable container
        const scrollContainer = document.createElement('div');
        scrollContainer.className = 'flex-1 overflow-y-auto border border-gray-400';
        scrollContainer.appendChild(table);

        this.container.appendChild(scrollContainer);
    }

    public async refresh() {
        await this.init();
    }
}

// ===========================
// USER INFO COMPONENT
// ===========================
export interface UserInfoComponentOptions {
    container: HTMLElement;
    userId?: number;
    width?: string;
    height?: string;
}

export class UserInfoComponent {
    private container: HTMLElement;
    private options: UserInfoComponentOptions;
    private profile: UserProfile | null = null;
    private loading = false;

    constructor(options: UserInfoComponentOptions) {
        this.container = options.container;
        this.options = {
            width: '100%',
            height: '200px',
            ...options
        };
        this.init();
    }

    private async init() {
        this.loading = true;
        this.showLoading();

        try {
            this.profile = await UserService.getUserProfile(this.options.userId);
            this.loading = false;
			this.render();
        } catch (error) {
            console.error('Failed to load user profile:', error);
            this.showError('Failed to load profile');
			this.loading = false;
        }
    }

    private showLoading() {
        this.container.innerHTML = '';
        this.container.className = 'sunken-panel bg-gray-100 p-3 flex items-center justify-center';
        this.container.style.cssText = `width: ${this.options.width}; height: ${this.options.height};`;
        this.container.innerHTML = `
            <div class="text-gray-600 text-xs">⏳ Loading profile...</div>
        `;
    }

    private showError(message: string) {
        this.container.innerHTML = `
            <div class="flex items-center justify-center h-full text-red-600 text-xs text-center">
                ❌ ${message}
            </div>
        `;
    }

    private render() {
        if (!this.profile || this.loading) return;

        this.container.innerHTML = '';
        this.container.className = 'sunken-panel bg-gray-300 p-3 flex flex-col';
        this.container.style.cssText = `
        width: ${this.options.width};
        height: ${this.options.height};
        background-color: #e0e0e0;
        padding: 12px;
    `;
        // Avatar and name section
        const headerSection = document.createElement('div');
        headerSection.className = 'flex items-center gap-3 mb-3 pb-2 border-b border-gray-500';

        const avatar = document.createElement('img');
        avatar.src = this.profile.avatarUrl || '/images/default-avatar.png';
        avatar.className = 'w-12 h-12 border-2 border-gray-500 rounded';

        const nameSection = document.createElement('div');
        const onlineColor = this.profile.isOnline ? 'text-green-600' : 'text-gray-600';
        const onlineIcon = this.profile.isOnline ? '🟢' : '🔴';
        const onlineText = this.profile.isOnline ? 'Online' : 'Offline';

        nameSection.innerHTML = `
            <div class="font-bold text-sm text-blue-800 mb-1">
                ${this.profile.userName}
            </div>
            <div class="text-xs ${onlineColor}">
                ${onlineIcon} ${onlineText}
            </div>
        `;

        headerSection.appendChild(avatar);
        headerSection.appendChild(nameSection);

        // Bio section
        const bioSection = document.createElement('div');
        bioSection.className = 'flex-1 mb-2';

        const bioLabel = document.createElement('div');
        bioLabel.textContent = 'Bio:';
        bioLabel.className = 'font-bold text-xs mb-1 text-gray-600';

        const bioText = document.createElement('div');
        bioText.textContent = this.profile.bioText || 'No bio available.';
        bioText.className = 'text-xs leading-relaxed text-gray-800 border border-gray-400 p-2 max-h-16 overflow-y-auto';
		bioText.style.backgroundColor = '#f0f0f0';

        bioSection.appendChild(bioLabel);
        bioSection.appendChild(bioText);

        // Info section
        const infoSection = document.createElement('div');
        infoSection.className = 'grid grid-cols-2 gap-2 text-xs';

        const joinDate = new Date(this.profile.accountCreationDate).toLocaleDateString();
        const lastOnline = this.profile.isOnline ? 'Now' : formatTimeAgo(this.profile.lastOnline);

        const joinedDiv = document.createElement('div');
        joinedDiv.className = 'text-center';
        joinedDiv.style.cssText = `
            background-color: #f0f0f0;
            border: 1px inset #c0c0c0;
            padding: 4px;
        `;
        joinedDiv.innerHTML = `
            <div style="font-size: 10px; color: #666;">Joined</div>
            <div class="font-bold" style="color: #000080;">${joinDate}</div>
        `;

        const lastOnlineDiv = document.createElement('div');
        lastOnlineDiv.className = 'text-center';
        lastOnlineDiv.style.cssText = `
            background-color: #f0f0f0;
            border: 1px inset #c0c0c0;
            padding: 4px;
        `;
        lastOnlineDiv.innerHTML = `
            <div style="font-size: 10px; color: #666;">Last Online</div>
            <div class="font-bold" style="color: #000080;">${lastOnline}</div>
        `;

        infoSection.appendChild(joinedDiv);
        infoSection.appendChild(lastOnlineDiv);

        this.container.appendChild(headerSection);
        this.container.appendChild(bioSection);
        this.container.appendChild(infoSection);
    }

    public async refresh() {
        await this.init();
    }

    public getProfile(): UserProfile | null {
        return this.profile;
    }
}

// ===========================
// TOURNAMENT STATS COMPONENT
// ===========================
export interface TournamentStatsComponentOptions {
    container: HTMLElement;
    userId?: number;
    width?: string;
    height?: string;
    showTitle?: boolean;
}

export class TournamentStatsComponent {
    private container: HTMLElement;
    private options: TournamentStatsComponentOptions;
    private stats: TournamentStatistics | null = null;
    private loading = false;

    constructor(options: TournamentStatsComponentOptions) {
        this.container = options.container;
        this.options = {
            width: '100%',
            height: '150px',
            showTitle: true,
            ...options
        };
        this.init();
    }

    private async init() {
        this.loading = true;
        this.showLoading();

        try {
            this.stats = await UserService.getTournamentStatistics(this.options.userId);
            this.loading = false;
			this.render();
        } catch (error) {
            console.error('Failed to load tournament statistics:', error);
            this.showError('Failed to load tournament stats');
			this.loading = false;
        }
    }

    private showLoading() {
        this.container.innerHTML = '';
        this.container.className = 'sunken-panel bg-gray-300 p-2 flex items-center justify-center';
        this.container.style.cssText = `width: ${this.options.width}; height: ${this.options.height};`;
        this.container.innerHTML = `
            <div class="text-gray-600 text-xs">⏳ Loading tournament stats...</div>
        `;
    }

    private showError(message: string) {
        this.container.innerHTML = `
            <div class="flex items-center justify-center h-full text-red-600 text-xs text-center">
                ❌ ${message}
            </div>
        `;
    }

    private render() {
        if (!this.stats) return;

        this.container.innerHTML = '';
        this.container.className = 'sunken-panel bg-gray-300 p-2 flex flex-col overflow-hidden';
        this.container.style.cssText = `
        width: ${this.options.width};
        height: ${this.options.height};
        background-color: #e0e0e0;
        padding: 12px;
    `;
        // Title
        if (this.options.showTitle) {
            const title = document.createElement('h4');
            title.textContent = 'Tournament Stats';
            title.className = 'text-xs font-bold text-center text-blue-800 border-b border-gray-500 pb-1 mb-2 flex-shrink-0';
            this.container.appendChild(title);
        }

        // Stats grid
        const statsGrid = document.createElement('div');
        statsGrid.className = 'grid grid-cols-3 gap-2 mb-2 text-xs';

        const statsData = [
            { label: 'Won', value: this.stats.tournamentsWon, color: 'text-green-600' },
            { label: 'Played', value: this.stats.tournamentsParticipated, color: 'text-red-600' },
            { label: 'Win Rate', value: `${this.stats.winPercentage}%`, color: 'text-blue-800' }
        ];

        statsData.forEach(stat => {
            const statDiv = document.createElement('div');
            statDiv.className = 'text-center p-1 flex flex-col justify-center';
            statDiv.style.cssText = `
                background-color: #f0f0f0;
                border: 1px inset #c0c0c0;
                padding: 4px;
            `;

            statDiv.innerHTML = `
                <div class="font-bold ${stat.color} text-sm mb-1">
                    ${stat.value}
                </div>
                <div style="font-size: 10px; color: #666;">
                    ${stat.label}
                </div>
            `;

            statsGrid.appendChild(statDiv);
        });

        this.container.appendChild(statsGrid);
    }

    public async refresh() {
        await this.init();
    }

    public getStats(): TournamentStatistics | null {
        return this.stats;
    }
}

// ===========================
// PLAYER VS AI STATS COMPONENT
// ===========================
export interface PlayerVsAIStatsComponentOptions {
    container: HTMLElement;
    userId?: number;
    width?: string;
    height?: string;
    showTitle?: boolean;
}

export class PlayerVsAIStatsComponent {
    private container: HTMLElement;
    private options: PlayerVsAIStatsComponentOptions;
    private stats: PlayerVsAIStatistics | null = null;
    private loading = false;

    constructor(options: PlayerVsAIStatsComponentOptions) {
        this.container = options.container;
        this.options = {
            width: '100%',
            height: '180px',
            showTitle: true,
            ...options
        };
        this.init();
    }

    private async init() {
        this.loading = true;
        this.showLoading();

        try {
            this.stats = await UserService.getPlayerVsAIStatistics(this.options.userId);
            this.loading = false;
			this.render();
        } catch (error) {
            console.error('Failed to load AI statistics:', error);
            this.showError('Failed to load AI stats');
			this.loading = false;
        }
    }

    private showLoading() {
        this.container.innerHTML = '';
        this.container.className = 'sunken-panel bg-gray-300 p-2 flex items-center justify-center';
        this.container.style.cssText = `width: ${this.options.width}; height: ${this.options.height};`;
        this.container.innerHTML = `
            <div class="text-gray-600 text-xs">⏳ Loading AI stats...</div>
        `;
    }

    private showError(message: string) {
        this.container.innerHTML = `
            <div class="flex items-center justify-center h-full text-red-600 text-xs text-center">
                ❌ ${message}
            </div>
        `;
    }

    private render() {
        if (!this.stats || this.loading) return;

        this.container.innerHTML = '';
        this.container.className = 'sunken-panel bg-gray-300 p-2 flex flex-col overflow-hidden';
         this.container.style.cssText = `
        width: ${this.options.width};
        height: ${this.options.height};
        background-color: #e0e0e0;
        padding: 12px;
    `;
        // Title
        if (this.options.showTitle) {
            const title = document.createElement('h4');
            title.textContent = 'Player vs AI';
            title.className = 'text-xs font-bold text-center text-blue-800 border-b border-gray-500 pb-1 mb-2 flex-shrink-0';
            this.container.appendChild(title);
        }

        // Main stats
        const mainStats = document.createElement('div');
        mainStats.className = 'grid grid-cols-3 gap-2 mb-2 text-xs';

        const totalGames = this.stats.gamesWon + this.stats.gamesLost;
        const mainStatsData = [
            { label: 'Won', value: this.stats.gamesWon, color: 'text-green-600' },
            { label: 'Lost', value: this.stats.gamesLost, color: 'text-red-600' },
            { label: 'Win Rate', value: `${this.stats.winPercentage}%`, color: 'text-blue-800' }
        ];

        mainStatsData.forEach(stat => {
            const statDiv = document.createElement('div');
            statDiv.className = 'text-center flex flex-col justify-center';

            statDiv.style.cssText = `
                background-color: #f0f0f0;
                border: 1px inset #c0c0c0;
                padding: 4px;
            `;

            statDiv.innerHTML = `
                <div class="font-bold ${stat.color} text-sm">
                    ${stat.value}
                </div>
                <div style="font-size: 10px; color: #666;">
                    ${stat.label}
                </div>
            `;

            mainStats.appendChild(statDiv);
        });

        this.container.appendChild(mainStats);

    }

    public async refresh() {
        await this.init();
    }

    public getStats(): PlayerVsAIStatistics | null {
        return this.stats;
    }
}

// Helper functions for all profile components
export const createOneVOneStatsComponent = (options: OneVOneStatsComponentOptions) => new OneVOneStatsComponent(options);
export const createMatchHistoryComponent = (options: MatchHistoryComponentOptions) => new MatchHistoryComponent(options);
export const createUserInfoComponent = (options: UserInfoComponentOptions) => new UserInfoComponent(options);
export const createTournamentStatsComponent = (options: TournamentStatsComponentOptions) => new TournamentStatsComponent(options);
export const createPlayerVsAIStatsComponent = (options: PlayerVsAIStatsComponentOptions) => new PlayerVsAIStatsComponent(options);
