import { Router } from "../router";
import { createWindow, createTaskbar, createStaticDesktopBackground } from "./_components";
import { 
    createOneVOneStatsComponent,
    createMatchHistoryComponent,
    createUserInfoComponent,
    createTournamentStatsComponent,
    createPlayerVsAIStatsComponent
} from "./_userComponents";

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