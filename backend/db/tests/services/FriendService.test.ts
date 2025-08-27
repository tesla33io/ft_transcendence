import { FtDatabase } from '../../src/index';
import { User } from '../../src/entities/index';

describe('FriendService', () => {
    let gameDb: FtDatabase;
    let user1: User, user2: User, user3: User;

    beforeAll(() => {
        gameDb = FtDatabase.getInstance();
    });

    beforeEach(async () => {
        user1 = await gameDb.userService.createUser('user1', 'pass1');
        user2 = await gameDb.userService.createUser('user2', 'pass2');
        user3 = await gameDb.userService.createUser('user3', 'pass3');
    });

    describe('sendFriendRequest', () => {
        it('should send friend request successfully', async () => {
            const request = await gameDb.friendService.sendFriendRequest(user1.id, user2.id);

            expect(request.id).toBeDefined();
            expect(request.userFrom.id).toBe(user1.id);
            expect(request.userTo.id).toBe(user2.id);
            expect(request.status).toBe('pending');
            expect(request.createdAt).toBeInstanceOf(Date);
            expect(request.acceptedAt).toBeUndefined();
        });

        it('should throw error when sending request to self', async () => {
            await expect(
                gameDb.friendService.sendFriendRequest(user1.id, user1.id)
            ).rejects.toThrow('Cannot send friend request to yourself');
        });

        it('should throw error for duplicate request', async () => {
            await gameDb.friendService.sendFriendRequest(user1.id, user2.id);

            await expect(
                gameDb.friendService.sendFriendRequest(user1.id, user2.id)
            ).rejects.toThrow('Friend request already exists or users are already friends');
        });

        it('should throw error for reverse duplicate request', async () => {
            await gameDb.friendService.sendFriendRequest(user1.id, user2.id);

            await expect(
                gameDb.friendService.sendFriendRequest(user2.id, user1.id)
            ).rejects.toThrow('Friend request already exists or users are already friends');
        });

        it('should throw error when users are already friends', async () => {
            const request = await gameDb.friendService.sendFriendRequest(user1.id, user2.id);
            await gameDb.friendService.acceptFriendRequest(request.id, user2.id);

            await expect(
                gameDb.friendService.sendFriendRequest(user2.id, user1.id)
            ).rejects.toThrow('Friend request already exists or users are already friends');
        });
    });

    describe('acceptFriendRequest', () => {
        let request: any;

        beforeEach(async () => {
            request = await gameDb.friendService.sendFriendRequest(user1.id, user2.id);
        });

        it('should accept friend request successfully', async () => {
            const accepted = await gameDb.friendService.acceptFriendRequest(request.id, user2.id);

            expect(accepted.status).toBe('accepted');
            expect(accepted.acceptedAt).toBeInstanceOf(Date);
        });

        it('should throw error for non-existent request', async () => {
            await expect(
                gameDb.friendService.acceptFriendRequest(99999, user2.id)
            ).rejects.toThrow('Friend request not found or already processed');
        });

        it('should throw error when wrong user tries to accept', async () => {
            await expect(
                gameDb.friendService.acceptFriendRequest(request.id, user3.id)
            ).rejects.toThrow('Friend request not found or already processed');
        });

        it('should throw error when sender tries to accept', async () => {
            await expect(
                gameDb.friendService.acceptFriendRequest(request.id, user1.id)
            ).rejects.toThrow('Friend request not found or already processed');
        });

        it('should throw error for already processed request', async () => {
            await gameDb.friendService.acceptFriendRequest(request.id, user2.id);

            await expect(
                gameDb.friendService.acceptFriendRequest(request.id, user2.id)
            ).rejects.toThrow('Friend request not found or already processed');
        });
    });

    describe('rejectFriendRequest', () => {
        let request: any;

        beforeEach(async () => {
            request = await gameDb.friendService.sendFriendRequest(user1.id, user2.id);
        });

        it('should reject friend request successfully', async () => {
            await expect(
                gameDb.friendService.rejectFriendRequest(request.id, user2.id)
            ).resolves.not.toThrow();

            // Verify request is removed
            const foundRequest = await gameDb.repositories.friend.findOne({ id: request.id });
            expect(foundRequest).toBeNull();
        });

        it('should throw error for non-existent request', async () => {
            await expect(
                gameDb.friendService.rejectFriendRequest(99999, user2.id)
            ).rejects.toThrow('Friend request not found or already processed');
        });

        it('should throw error when wrong user tries to reject', async () => {
            await expect(
                gameDb.friendService.rejectFriendRequest(request.id, user3.id)
            ).rejects.toThrow('Friend request not found or already processed');
        });
    });

    describe('getFriendRequests', () => {
        it('should return pending friend requests for user', async () => {
            await gameDb.friendService.sendFriendRequest(user1.id, user2.id);
            await gameDb.friendService.sendFriendRequest(user3.id, user2.id);

            const requests = await gameDb.friendService.getFriendRequests(user2.id);

            expect(requests).toHaveLength(2);
            expect(requests[0].userFrom.id).toBe(user3.id); // Should be ordered by created_at DESC
            expect(requests[1].userFrom.id).toBe(user1.id);
            expect(requests.every(r => r.status === 'pending')).toBe(true);
        });

        it('should not return accepted requests', async () => {
            const request = await gameDb.friendService.sendFriendRequest(user1.id, user2.id);
            await gameDb.friendService.acceptFriendRequest(request.id, user2.id);

            const requests = await gameDb.friendService.getFriendRequests(user2.id);
            expect(requests).toHaveLength(0);
        });

        it('should return empty array when no requests', async () => {
            const requests = await gameDb.friendService.getFriendRequests(user1.id);
            expect(requests).toHaveLength(0);
        });
    });

    describe('getFriends', () => {
        beforeEach(async () => {
            // Create friendships
            const request1 = await gameDb.friendService.sendFriendRequest(user1.id, user2.id);
            await gameDb.friendService.acceptFriendRequest(request1.id, user2.id);

            const request2 = await gameDb.friendService.sendFriendRequest(user3.id, user1.id);
            await gameDb.friendService.acceptFriendRequest(request2.id, user1.id);
        });

        it('should return friends for user who sent requests', async () => {
            const friends = await gameDb.friendService.getFriends(user1.id);

            expect(friends).toHaveLength(2);
            const friendIds = friends.map(f => f.id).sort();
            expect(friendIds).toEqual([user2.id, user3.id]);
        });

        it('should return friends for user who received requests', async () => {
            const friends = await gameDb.friendService.getFriends(user2.id);

            expect(friends).toHaveLength(1);
            expect(friends[0].id).toBe(user1.id);
        });

        it('should not return pending requests as friends', async () => {
            await gameDb.friendService.sendFriendRequest(user2.id, user3.id);

            const friendsUser2 = await gameDb.friendService.getFriends(user2.id);
            const friendsUser3 = await gameDb.friendService.getFriends(user3.id);

            expect(friendsUser2.find(f => f.id === user3.id)).toBeUndefined();
            expect(friendsUser3.find(f => f.id === user2.id)).toBeUndefined();
        });

        it('should return empty array when no friends', async () => {
            const newUser = await gameDb.userService.createUser('newfriend', 'pass');
            const friends = await gameDb.friendService.getFriends(newUser.id);

            expect(friends).toHaveLength(0);
        });
    });

    describe('removeFriend', () => {
        let request: any;

        beforeEach(async () => {
            request = await gameDb.friendService.sendFriendRequest(user1.id, user2.id);
            await gameDb.friendService.acceptFriendRequest(request.id, user2.id);
        });

        it('should remove friendship successfully', async () => {
            await expect(
                gameDb.friendService.removeFriend(user1.id, user2.id)
            ).resolves.not.toThrow();

            // Verify friendship is removed
            const friends1 = await gameDb.friendService.getFriends(user1.id);
            const friends2 = await gameDb.friendService.getFriends(user2.id);

            expect(friends1).toHaveLength(0);
            expect(friends2).toHaveLength(0);
        });

        it('should work regardless of who removes whom', async () => {
            await gameDb.friendService.removeFriend(user2.id, user1.id);

            const friends = await gameDb.friendService.getFriends(user1.id);
            expect(friends).toHaveLength(0);
        });

        it('should throw error for non-existent friendship', async () => {
            await expect(
                gameDb.friendService.removeFriend(user1.id, user3.id)
            ).rejects.toThrow('Friendship not found');
        });
    });

    describe('areFriends', () => {
        beforeEach(async () => {
            const request = await gameDb.friendService.sendFriendRequest(user1.id, user2.id);
            await gameDb.friendService.acceptFriendRequest(request.id, user2.id);
        });

        it('should return true for friends', async () => {
            const areFriends1 = await gameDb.friendService.areFriends(user1.id, user2.id);
            const areFriends2 = await gameDb.friendService.areFriends(user2.id, user1.id);

            expect(areFriends1).toBe(true);
            expect(areFriends2).toBe(true);
        });

        it('should return false for non-friends', async () => {
            const areFriends = await gameDb.friendService.areFriends(user1.id, user3.id);
            expect(areFriends).toBe(false);
        });

        it('should return false for pending requests', async () => {
            await gameDb.friendService.sendFriendRequest(user2.id, user3.id);

            const areFriends = await gameDb.friendService.areFriends(user2.id, user3.id);
            expect(areFriends).toBe(false);
        });
    });
});
