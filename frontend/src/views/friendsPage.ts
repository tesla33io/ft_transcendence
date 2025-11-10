import { Router } from "../router";
import { createWindow } from "../components/_components";
import { createTaskbar, createStaticDesktopBackground } from "../components/_components";
import { createFriendsComponent, createSimpleFriendsActionsComponent } from "../components/_userComponents";
import { createFriendProfilePage } from "../components/_profilePageBuilder"; 

export function friendsView(router: Router) {
    const root = document.getElementById("app");
    if (!root) {
        console.error("App root element not found!");
        return;
    }
    root.innerHTML = "";

    
        
    // Create content container
    const content = document.createElement('div');
    content.style.cssText = `
        padding: 15px;
        display: flex;
        gap: 15px;
        height: 100%;
    `;

	const staticBackground = createStaticDesktopBackground();
    staticBackground.attachToPage(root);

    // Friends list container
    const friendsContainer = document.createElement('div');
    
    // Friends actions container
    const actionsContainer = document.createElement('div');

    // ✅ Function to open friend profile
    const openFriendProfile = (friend: any) => {
        console.log('Opening profile for friend:', friend);
        
        // Close current friends window and open profile
        staticBackground.remove();
        
        // Use the profile builder to create a friend profile page
        createFriendProfilePage(friend.id || friend.userId, router);
    };

    // Create simplified friends actions component
    const friendsActions = createSimpleFriendsActionsComponent({
        container: actionsContainer,
        onRefreshFriends: () => {
            friendsComponent.refresh();
        },
        // ✅ Pass the profile opening function
        onViewProfile: openFriendProfile
    });

    // Create friends component
    const friendsComponent = createFriendsComponent({
        container: friendsContainer,
        height: '350px',
        width: '400px',
        showTitle: true,
        onFriendSelect: (friend) => {
            console.log('Selected friend:', friend);
            // Update the actions component with selected friend
            friendsActions.updateSelectedFriend(friend);
        },
        onError: (error) => {
            console.error('Friends component error:', error);
        }
    });

    content.appendChild(friendsContainer);
    content.appendChild(actionsContainer);

    // Create window
    const window = createWindow({
        title: 'Friends',
        width: '650px',
        height: '450px',
        content: content,
        titleBarControls: {
            help: true,
            close: true,
            onClose: () => {
                staticBackground.remove();
                router.navigateToDesktop();
            }
        }
    });

    root.appendChild(window);

    const { taskbar } = createTaskbar({
		clock: true,
		router: router
	});
    
    root.appendChild(taskbar);
}
