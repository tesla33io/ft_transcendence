// ============================================
// CORE UI COMPONENTS
// ============================================
export { 
    createWindow,
    MatchHistory,
    Stats,
    createTaskbar,
    createStaticDesktopBackground,
    StaticDesktopBackground
} from './_components';


// ============================================
// GAME PAGE COMPONENTS
// ============================================
export {
    createGameHeader,
    updateGameHeader,
    updatePlayerNames,
    createGameCanvasContainer
} from './_gamePageComponents';

export type { 
    ScoreboardConfig,
    CanvasConfig
} from './_gamePageComponents';

// ============================================
// USER & FRIENDS COMPONENTS
// ============================================

// Friends Component
export { FriendsComponent, createFriendsComponent } from './_userComponents';
export type { FriendsComponentOptions } from './_userComponents';

// Friend Request Windows
export { 
    createSendFriendRequestWindow,
} from './_userComponents';

// Friends Actions Component
export { 
    SimpleFriendsActionsComponent,
    createSimpleFriendsActionsComponent 
} from './_userComponents';
export type { SimpleFriendsActionsOptions } from './_userComponents';

// ============================================
// PROFILE STATISTICS COMPONENTS
// ============================================

// 1v1 Statistics
export { OneVOneStatsComponent, createOneVOneStatsComponent } from './_userComponents';
export type { OneVOneStatsComponentOptions } from './_userComponents';

// Match History
export { MatchHistoryComponent, createMatchHistoryComponent } from './_userComponents';
export type { MatchHistoryComponentOptions } from './_userComponents';

// User Info
export { UserInfoComponent, createUserInfoComponent } from './_userComponents';
export type { UserInfoComponentOptions } from './_userComponents';

// Tournament Stats
export { TournamentStatsComponent, createTournamentStatsComponent } from './_userComponents';
export type { TournamentStatsComponentOptions } from './_userComponents';

// Player vs AI Stats
export { PlayerVsAIStatsComponent, createPlayerVsAIStatsComponent } from './_userComponents';
export type { PlayerVsAIStatsComponentOptions } from './_userComponents';

// ============================================
// PROFILE PAGE BUILDER
// ============================================
export {
    createCompleteProfilePage,
    createMyProfilePage,
    createFriendProfilePage
} from './_profilePageBuilder';

export type { ProfilePageOptions } from './_profilePageBuilder';

// ...existing exports...

export {
    createLocalGameLayout,
    getModeName
} from './_gamePageComponents';

export type { 
    LocalGameLayoutConfig
} from './_gamePageComponents';