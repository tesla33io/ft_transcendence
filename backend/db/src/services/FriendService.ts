import { QueryOrder } from '@mikro-orm/core';
import { Database } from '../Database';
import { Friend, User } from '../entities/index';

export class FriendService {
    private db = Database.getInstance();

    async sendFriendRequest(fromUserId: number, toUserId: number): Promise<Friend> {
        const em = this.db.em;

        if (fromUserId === toUserId) {
            throw new Error('Cannot send friend request to yourself');
        }

        // Check if request already exists
        const existingRequest = await em.findOne(Friend, {
            $or: [
                { userFrom: fromUserId, userTo: toUserId },
                { userFrom: toUserId, userTo: fromUserId }
            ]
        });

        if (existingRequest) {
            throw new Error('Friend request already exists or users are already friends');
        }

        const fromUser = await em.getReference(User, fromUserId);
        const toUser = await em.getReference(User, toUserId);

        const friendRequest = new Friend();
        friendRequest.userFrom = fromUser;
        friendRequest.userTo = toUser;
        friendRequest.status = 'pending';

        await em.persistAndFlush(friendRequest);
        return friendRequest;
    }

    async acceptFriendRequest(requestId: number, userId: number): Promise<Friend> {
        const em = this.db.em;

        const request = await em.findOne(Friend, { 
            id: requestId, 
            userTo: userId, 
            status: 'pending' 
        });

        if (!request) {
            throw new Error('Friend request not found or already processed');
        }

        request.status = 'accepted';
        request.acceptedAt = new Date();
        await em.flush();

        return request;
    }

    async rejectFriendRequest(requestId: number, userId: number): Promise<void> {
        const em = this.db.em;

        const request = await em.findOne(Friend, { 
            id: requestId, 
            userTo: userId, 
            status: 'pending' 
        });

        if (!request) {
            throw new Error('Friend request not found or already processed');
        }

        await em.removeAndFlush(request);
    }

    async getFriendRequests(userId: number): Promise<Friend[]> {
        const em = this.db.em;

        return await em.find(Friend, 
                             { userTo: userId, status: 'pending' },
                             { 
                                 populate: ['userFrom'],
                                 orderBy: { createdAt: QueryOrder.DESC }
                             }
                            );
    }

    async getFriends(userId: number): Promise<User[]> {
        const em = this.db.em;

        const friendships = await em.find(Friend, {
            $or: [
                { userFrom: userId, status: 'accepted' },
                { userTo: userId, status: 'accepted' }
            ]
        }, {
            populate: ['userFrom', 'userTo']
        });

        return friendships.map(friendship => 
                               friendship.userFrom.id === userId ? friendship.userTo : friendship.userFrom
                              );
    }

    async removeFriend(userId: number, friendId: number): Promise<void> {
        const em = this.db.em;

        const friendship = await em.findOne(Friend, {
            $or: [
                { userFrom: userId, userTo: friendId, status: 'accepted' },
                { userFrom: friendId, userTo: userId, status: 'accepted' }
            ]
        });

        if (!friendship) {
            throw new Error('Friendship not found');
        }

        await em.removeAndFlush(friendship);
    }

    async areFriends(userId1: number, userId2: number): Promise<boolean> {
        const em = this.db.em;

        const friendship = await em.findOne(Friend, {
            $or: [
                { userFrom: userId1, userTo: userId2, status: 'accepted' },
                { userFrom: userId2, userTo: userId1, status: 'accepted' }
            ]
        });

        return !!friendship;
    }
}
