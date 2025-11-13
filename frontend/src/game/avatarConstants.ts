import agent from "../views/images/avatars/msagent.png"
import book_user from "../views/images/avatars/book_user.png"
import rabit from "../views/images/avatars/rabit.png"

// ===========================
// AVATAR CONFIGURATION
// ===========================

export type AvatarId = 'agent' | 'book_user' | 'rabit';

export interface AvatarPreset {
    id: AvatarId;
    name: string;
    src: string;
}


export const AVATAR_PRESETS: readonly AvatarPreset[] = [
    { id: 'agent', name: 'Agent', src: agent },
    { id: 'book_user', name: 'User', src: book_user },
    { id: 'rabit', name: 'Rabit', src: rabit }
] as const;


export const DEFAULT_AVATAR_ID: AvatarId = 'agent';

export const AVATAR_MAP: Record<AvatarId, string> = {
    'agent': agent,
    'book_user': book_user,
    'rabit': rabit
};

/**
 * Resolve avatar ID to image source
 * @param avatarId - Avatar ID from backend (e.g., "agent", "book_user", "rabit")
 * @returns Image source path
 */
export function resolveAvatar(avatarId: string | null | undefined): string {
    if (!avatarId) return AVATAR_MAP[DEFAULT_AVATAR_ID];
    
    // Check if it's a valid preset ID
    if (avatarId in AVATAR_MAP) {
        return AVATAR_MAP[avatarId as AvatarId];
    }
    
    // If it's already a full URL/path (legacy data), return as-is
    if (avatarId.startsWith('http') || avatarId.startsWith('/') || avatarId.startsWith('data:')) {
        return avatarId;
    }
    
    // Fallback to default
    console.warn(`Unknown avatar ID: ${avatarId}, using default`);
    return AVATAR_MAP[DEFAULT_AVATAR_ID];
}