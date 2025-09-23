---
name: Online Status Tracking System
about: Implement real-time online status tracking for users
title: 'feat (user): real-time online status tracking'
labels: ['enhancement', 'user-management', 'real-time', 'websocket']
assignees: ''
---

## Feature Description
Implement real-time online status tracking allowing users to view their friends' online status and activity, as required by the ft_transcendence subject.

## Requirements
- [ ] Real-time online/offline status tracking for all users
- [ ] Last seen timestamp tracking with privacy controls
- [ ] Activity status tracking (in game, idle, away, etc.)
- [ ] Friend list online status display
- [ ] WebSocket integration for real-time status updates
- [ ] Status privacy controls and visibility settings

## Implementation Steps

### Backend Implementation
- [ ] **Database Schema Updates**
  - Add `last_seen` TIMESTAMP column to users table
  - Add `online_status` ENUM column ('online', 'offline', 'away', 'in_game', 'busy')
  - Add `activity_type` VARCHAR for detailed status ('playing_pong', 'in_tournament', 'browsing')
  - Create `user_sessions` table for active session tracking
  - Add `status_visibility` ENUM for privacy ('public', 'friends', 'hidden')
  - Add `last_activity` TIMESTAMP for idle detection

- [ ] **WebSocket Integration**
  - Install and configure WebSocket support (@fastify/websocket)
  - Implement WebSocket connection management and authentication
  - Create status change broadcasting system to relevant users
  - Connection cleanup and session management
  - Heartbeat mechanism for accurate online/offline detection
  - Connection pooling and scaling considerations

- [ ] **Status Tracking Service**
  - Real-time status updates based on user activity
  - Automatic idle detection after inactivity timeout
  - Session timeout handling (offline after disconnect)
  - Status change notification system
  - Batch status updates for efficiency
  - Privacy-aware status broadcasting

- [ ] **Status Management API Endpoints**
  - `GET /api/v1/users/me/friends/status` - Get friends' online status
  - `PUT /api/v1/users/me/status` - Manual status update
  - `POST /api/v1/users/me/activity` - Update activity type
  - `GET /api/v1/users/:id/status` - Get specific user status (privacy-aware)
  - `PUT /api/v1/users/me/status/settings` - Update status privacy settings
  - WebSocket endpoint `/ws/status` for real-time status updates

### Frontend Implementation
- [ ] **WebSocket Client Integration**
  - WebSocket connection management with auto-reconnection
  - Authentication for WebSocket connections
  - Real-time status update handling and UI synchronization
  - Connection state management (connecting, connected, disconnected)
  - Error handling and fallback to polling if WebSocket fails

- [ ] **Online Status Indicators**
  - **Status Indicator Components**
    - Color-coded status dots (green=online, yellow=away, red=offline, blue=in_game)
    - Status text display with activity details
    - Animated indicators for active status changes
    - Responsive design for different screen sizes
    - Accessibility support (alt text, high contrast mode)

  - **Friend List Integration**
    - Real-time status updates in friend lists
    - Sort friends by online status
    - Activity type display ("Playing Pong Tournament")
    - Last seen timestamp for offline friends
    - Status filter options (show only online friends)

- [ ] **Status Management Interface**
  - **User Status Controls**
    - Status selection dropdown in header/navigation
    - Custom status message input
    - Do Not Disturb mode toggle
    - Away/idle automatic detection with manual override
    - Quick status presets for common activities

  - **Privacy Settings**
    - Status visibility controls (public, friends only, hidden)
    - Activity detail sharing preferences
    - Last seen timestamp visibility options
    - Granular privacy for different status types
    - Friend category-based visibility (close friends, acquaintances)

### Testing Requirements
- [ ] **Unit Tests**
  - Status change detection and validation
  - Privacy control enforcement
  - WebSocket message handling
  - Session timeout calculations
  - Status broadcasting logic

- [ ] **Integration Tests**
  - WebSocket connection lifecycle
  - Status synchronization across multiple clients
  - Friend list status updates
  - Privacy setting enforcement
  - Database session management

- [ ] **Performance Tests**
  - WebSocket connection scalability
  - Status update broadcasting performance
  - Concurrent user session handling
  - Memory usage with many active connections
  - Network efficiency of status updates

- [ ] **End-to-End Tests**
  - Complete status change workflow
  - Real-time updates across different browsers/devices
  - Privacy controls impact on status visibility
  - Status display in various UI components

## Acceptance Criteria
- [ ] Users can see friends' online/offline status in real-time
- [ ] Status updates are reflected immediately (within 5 seconds)
- [ ] Last seen timestamps are accurate and properly formatted
- [ ] Activity status (in game, tournament, etc.) is properly tracked and displayed
- [ ] Status changes are broadcast to friends immediately via WebSocket
- [ ] Privacy controls work correctly for status visibility
- [ ] Users can manually set their status and activity
- [ ] Automatic idle/away detection works based on inactivity
- [ ] Status indicators are consistent across all platform interfaces
- [ ] WebSocket connections handle disconnection and reconnection gracefully

## Dependencies
- [ ] Issue #7: Database schema improvements (user status columns)
- [ ] Issue #6: Friends management (friend relationship data)
- [ ] WebSocket infrastructure setup
- [ ] Authentication system integration for WebSocket connections
- [ ] Game engine integration for "in game" status detection

## Estimated Effort
**2-3 weeks** (WebSocket implementation and real-time synchronization complexity)

### Breakdown:
- Backend WebSocket and status service: 1.5 weeks
- Frontend real-time UI and status management: 1 week
- Testing and optimization: 0.5 weeks

## Additional Notes

### Status Types:
1. **Online**: Actively using the platform
2. **Away**: Idle for 5+ minutes, but connection active
3. **Offline**: No active connection
4. **In Game**: Currently playing a match
5. **Busy/DND**: Do not disturb mode enabled
6. **In Tournament**: Participating in tournament

### Activity Types:
- `browsing` - General platform usage
- `playing_pong` - In 1v1 match
- `in_tournament` - Tournament participation
- `watching_match` - Spectating other games
- `managing_profile` - Profile editing
- `chatting` - In chat/messaging
- `idle` - No recent activity

### Privacy Levels:
1. **Public**: Status visible to everyone
2. **Friends Only**: Status visible to friends only
3. **Close Friends**: Status visible to selected friends
4. **Hidden**: Appear offline to everyone except admins

### WebSocket Message Types:
```json
{
  "type": "status_update",
  "user_id": 123,
  "status": "online",
  "activity": "playing_pong",
  "timestamp": "2024-01-15T14:30:00Z"
}

{
  "type": "friend_status_change",
  "friend_id": 456,
  "status": "in_game",
  "activity": "in_tournament",
  "last_seen": "2024-01-15T14:30:00Z"
}
```

### Status Update Triggers:
- **User Login**: Set status to online
- **User Logout**: Set status to offline
- **Game Start**: Set status to in_game
- **Game End**: Return to previous status
- **Inactivity**: Auto-switch to away after 5 minutes
- **Manual Change**: User-initiated status change
- **Connection Loss**: Set status to offline after timeout

### Performance Optimizations:
- **Connection Pooling**: Efficient WebSocket connection management
- **Message Batching**: Group multiple status updates
- **Selective Broadcasting**: Only send updates to relevant friends
- **Caching**: Cache status data to reduce database queries
- **Compression**: Compress WebSocket messages for efficiency

### Idle Detection Algorithm:
1. Track user interactions (mouse, keyboard, API calls)
2. Set timer for inactivity threshold (5 minutes)
3. Send "still there?" ping after threshold
4. Mark as away if no response within 1 minute
5. Allow manual status override

### Privacy Considerations:
- Default to friends-only visibility for new users
- Clear explanation of what status information is shared
- Option to appear offline while still using platform
- Granular control over activity detail sharing
- Compliance with privacy regulations

### Scalability Considerations:
- WebSocket connection limits and load balancing
- Redis pub/sub for multi-server status synchronization
- Database optimization for frequent status updates
- Connection cleanup for abandoned sessions
- Horizontal scaling of WebSocket servers

### Future Enhancements:
- Custom status messages and emojis
- Status scheduling (auto-away during certain hours)
- Integration with external calendars
- Rich presence with game details
- Status history and patterns analysis
- Mobile push notifications for friend status changes

### Error Handling:
- WebSocket connection failures with fallback to HTTP polling
- Status synchronization conflicts resolution
- Network interruption recovery
- Invalid status transition handling
- Database update failures with retry logic

This real-time status system enhances the social aspect of the platform by keeping users connected and informed about their friends' activities while respecting privacy preferences.