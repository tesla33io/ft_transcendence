export interface Avatar {
    id: string;
    name: string;
    imagePath: string;
    description?: string;
}

export const AVAILABLE_AVATARS: Avatar[] = [
    {
        id: 'msagent',
        name: 'MS Agent',
        imagePath: '/src/views/images/avatars/msagent.png',
        description: 'Classic Microsoft Agent'
    },
    {
        id: 'book_user',
        name: 'Book User',
        imagePath: '/src/views/images/avatars/book_user.png',
        description: 'Bookworm character'
    },
    {
        id: 'rabbit',
        name: 'Rabbit',
        imagePath: '/src/views/images/avatars/rabit.png',
        description: 'Cute rabbit avatar'
    }
];

export const DEFAULT_AVATAR: Avatar = AVAILABLE_AVATARS[0]; // MS Agent as default

export class AvatarService {
    private static STORAGE_KEY = 'selectedAvatar';

    /**
     * Save selected avatar to localStorage
     */
    static saveSelectedAvatar(avatarId: string): void {
        localStorage.setItem(this.STORAGE_KEY, avatarId);
    }

    /**
     * Get currently selected avatar from localStorage
     */
    static getSelectedAvatar(): Avatar {
        const savedAvatarId = localStorage.getItem(this.STORAGE_KEY);
        
        if (savedAvatarId) {
            const avatar = AVAILABLE_AVATARS.find(a => a.id === savedAvatarId);
            if (avatar) return avatar;
        }
        
        return DEFAULT_AVATAR;
    }

    /**
     * Get avatar by ID, fallback to default
     */
    static getAvatarById(id: string): Avatar {
        return AVAILABLE_AVATARS.find(a => a.id === id) || DEFAULT_AVATAR;
    }

    /**
     * Get all available avatars
     */
    static getAllAvatars(): Avatar[] {
        return [...AVAILABLE_AVATARS];
    }

    /**
     * Clear saved avatar (reset to default)
     */
    static clearSelectedAvatar(): void {
        localStorage.removeItem(this.STORAGE_KEY);
    }
}