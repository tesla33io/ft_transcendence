---
name: Database Schema Improvements for User Management
about: Implement comprehensive database schema for user management features
title: 'feat (database): comprehensive user management schema'
labels: ['enhancement', 'database', 'user-management', 'infrastructure']
assignees: ''
---

## Feature Description
Implement comprehensive database schema improvements to support all user management features with proper indexing, constraints, relationships, and migration system.

## Requirements
- [ ] Complete user table structure with all required columns
- [ ] Proper foreign key relationships and constraints
- [ ] Performance indexing for all user management features
- [ ] Data integrity constraints and validation rules
- [ ] Migration system for safe schema updates
- [ ] Support for all identified user management features

## Implementation Steps

### Database Schema Implementation
- [ ] **Enhanced Users Table**
  - Expand current users table with comprehensive columns
  - Add avatar management columns
  - Add status tracking columns  
  - Add security and authentication columns
  - Add user preference and settings columns
  - Implement proper constraints and defaults

- [ ] **User Statistics Tables**
  - Create comprehensive user statistics table
  - Add performance metrics tracking
  - Add tournament-specific statistics
  - Add historical statistics support
  - Implement proper aggregation support

- [ ] **Match History Tables**
  - Create detailed match history table
  - Add comprehensive game details support
  - Add tournament context linking
  - Add replay data support
  - Implement proper indexing for queries

- [ ] **Supporting Tables**
  - Username history tracking table
  - User sessions for status management
  - Email verification table
  - Reserved usernames table
  - User preferences table

- [ ] **Relationships and Constraints**
  - Implement all foreign key relationships
  - Add proper cascading delete rules
  - Add check constraints for data validation
  - Add unique constraints for business rules
  - Implement proper indexing strategy

### Migration System Implementation
- [ ] **Migration Framework Setup**
  - Create migration tracking table
  - Implement migration versioning system
  - Add rollback capabilities for safe updates
  - Create development vs production strategies
  - Add migration validation and testing

- [ ] **Schema Migration Files**
  - Create individual migration files for each change
  - Implement proper up/down migration functions
  - Add data migration scripts where needed
  - Create migration testing procedures
  - Document migration dependencies

### Testing and Validation
- [ ] **Database Constraint Tests**
  - Test all unique constraints
  - Validate foreign key relationships
  - Test check constraints and data validation
  - Verify cascading delete behavior
  - Test constraint error handling

- [ ] **Performance Testing**
  - Test query performance with indexes
  - Validate pagination performance
  - Test concurrent access scenarios
  - Benchmark complex queries
  - Optimize slow query performance

- [ ] **Data Integrity Tests**
  - Test referential integrity
  - Validate data consistency across tables
  - Test transaction isolation
  - Verify backup and restore procedures
  - Test data migration accuracy

## Complete Database Schema

### Users Table (Enhanced)
```sql
CREATE TABLE users (
    -- Primary identification
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(30) UNIQUE NOT NULL COLLATE NOCASE,
    email VARCHAR(255) UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    
    -- Profile information
    display_name VARCHAR(50),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    bio TEXT,
    location VARCHAR(100),
    
    -- Avatar management
    avatar_url TEXT,
    has_custom_avatar BOOLEAN DEFAULT FALSE,
    avatar_upload_date TIMESTAMP,
    
    -- Status and activity
    online_status VARCHAR(20) DEFAULT 'offline' 
        CHECK (online_status IN ('online', 'offline', 'away', 'in_game', 'busy')),
    activity_type VARCHAR(50),
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Security and authentication
    role VARCHAR(20) DEFAULT 'user' 
        CHECK (role IN ('user', 'admin', 'moderator')),
    is_verified BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    
    -- Two-factor authentication
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT,
    backup_codes TEXT, -- JSON array of backup codes
    
    -- Privacy settings
    profile_visibility VARCHAR(20) DEFAULT 'public'
        CHECK (profile_visibility IN ('public', 'friends', 'private')),
    status_visibility VARCHAR(20) DEFAULT 'friends'
        CHECK (status_visibility IN ('public', 'friends', 'hidden')),
    match_history_visibility VARCHAR(20) DEFAULT 'friends'
        CHECK (match_history_visibility IN ('public', 'friends', 'private')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email_verified_at TIMESTAMP,
    last_login TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_username_lower ON users(LOWER(username));
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
CREATE INDEX idx_users_online_status ON users(online_status);
CREATE INDEX idx_users_last_seen ON users(last_seen);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### User Statistics Table
```sql
CREATE TABLE user_statistics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    
    -- Basic game statistics
    total_games INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    win_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Tournament statistics
    tournaments_played INTEGER DEFAULT 0,
    tournaments_won INTEGER DEFAULT 0,
    tournament_finals INTEGER DEFAULT 0,
    tournament_semifinals INTEGER DEFAULT 0,
    tournament_win_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Performance metrics
    average_score DECIMAL(5,2) DEFAULT 0.00,
    highest_score INTEGER DEFAULT 0,
    average_opponent_score DECIMAL(5,2) DEFAULT 0.00,
    average_game_duration INTEGER DEFAULT 0, -- seconds
    shortest_game INTEGER DEFAULT 0, -- seconds
    longest_game INTEGER DEFAULT 0, -- seconds
    
    -- Streak tracking
    current_win_streak INTEGER DEFAULT 0,
    best_win_streak INTEGER DEFAULT 0,
    current_loss_streak INTEGER DEFAULT 0,
    worst_loss_streak INTEGER DEFAULT 0,
    
    -- Ranking and rating
    current_rating INTEGER DEFAULT 1000,
    highest_rating INTEGER DEFAULT 1000,
    rating_change_last_game INTEGER DEFAULT 0,
    
    -- Time-based statistics
    games_today INTEGER DEFAULT 0,
    games_this_week INTEGER DEFAULT 0,
    games_this_month INTEGER DEFAULT 0,
    total_playtime INTEGER DEFAULT 0, -- seconds
    
    -- Additional metrics
    perfect_games INTEGER DEFAULT 0, -- games won with max score
    comeback_wins INTEGER DEFAULT 0, -- wins after being behind
    quick_wins INTEGER DEFAULT 0, -- wins under 2 minutes
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_game_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE UNIQUE INDEX idx_user_statistics_user_id ON user_statistics(user_id);
CREATE INDEX idx_user_statistics_rating ON user_statistics(current_rating);
CREATE INDEX idx_user_statistics_wins ON user_statistics(wins);
CREATE INDEX idx_user_statistics_updated_at ON user_statistics(updated_at);
```

### Match History Table
```sql
CREATE TABLE match_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Match participants
    user_id INTEGER NOT NULL,
    opponent_id INTEGER NOT NULL,
    
    -- Tournament context
    tournament_id INTEGER,
    tournament_round VARCHAR(50),
    tournament_match_type VARCHAR(30),
    
    -- Game details
    game_type VARCHAR(20) NOT NULL DEFAULT '1v1'
        CHECK (game_type IN ('1v1', 'tournament', 'practice', 'ranked')),
    game_mode VARCHAR(30) DEFAULT 'classic',
    difficulty_level VARCHAR(20) DEFAULT 'normal',
    
    -- Results
    result VARCHAR(10) NOT NULL 
        CHECK (result IN ('win', 'loss', 'draw', 'forfeit', 'timeout')),
    user_score INTEGER NOT NULL DEFAULT 0,
    opponent_score INTEGER NOT NULL DEFAULT 0,
    
    -- Timing information
    game_duration INTEGER, -- seconds
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Detailed game data
    game_details TEXT, -- JSON with detailed game information
    replay_data TEXT, -- Base64 encoded replay data
    
    -- Technical details
    platform VARCHAR(20) DEFAULT 'web',
    game_version VARCHAR(20),
    connection_quality VARCHAR(20),
    
    -- Metadata
    is_ranked BOOLEAN DEFAULT TRUE,
    is_valid BOOLEAN DEFAULT TRUE, -- for disputed/cancelled matches
    notes TEXT,
    
    -- Privacy
    visibility VARCHAR(20) DEFAULT 'public'
        CHECK (visibility IN ('public', 'friends', 'private', 'hidden')),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (opponent_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_match_history_user_id ON match_history(user_id);
CREATE INDEX idx_match_history_opponent_id ON match_history(opponent_id);
CREATE INDEX idx_match_history_played_at ON match_history(played_at);
CREATE INDEX idx_match_history_tournament_id ON match_history(tournament_id);
CREATE INDEX idx_match_history_result ON match_history(result);
CREATE INDEX idx_match_history_user_played ON match_history(user_id, played_at);
```

### Username History Table
```sql
CREATE TABLE username_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    old_username VARCHAR(30),
    new_username VARCHAR(30) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(100),
    changed_by_user_id INTEGER, -- for admin changes
    ip_address VARCHAR(45),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_username_history_user_id ON username_history(user_id);
CREATE INDEX idx_username_history_changed_at ON username_history(changed_at);
```

### User Sessions Table
```sql
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_type VARCHAR(50),
    location VARCHAR(100),
    
    -- Session status
    is_active BOOLEAN DEFAULT TRUE,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active);
```

### Email Verification Table
```sql
CREATE TABLE email_verification (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    email VARCHAR(255) NOT NULL,
    verification_token VARCHAR(255) UNIQUE NOT NULL,
    
    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_email_verification_user_id ON email_verification(user_id);
CREATE INDEX idx_email_verification_token ON email_verification(verification_token);
```

### Reserved Usernames Table
```sql
CREATE TABLE reserved_usernames (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(30) UNIQUE NOT NULL COLLATE NOCASE,
    reason VARCHAR(100),
    reserved_by_user_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (reserved_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_reserved_usernames_username ON reserved_usernames(LOWER(username));
```

### User Preferences Table
```sql
CREATE TABLE user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    
    -- UI preferences
    theme VARCHAR(20) DEFAULT 'light'
        CHECK (theme IN ('light', 'dark', 'auto')),
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Game preferences
    game_sound BOOLEAN DEFAULT TRUE,
    game_music BOOLEAN DEFAULT TRUE,
    game_effects BOOLEAN DEFAULT TRUE,
    auto_ready BOOLEAN DEFAULT FALSE,
    spectator_mode BOOLEAN DEFAULT TRUE,
    
    -- Notification preferences
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    friend_requests BOOLEAN DEFAULT TRUE,
    tournament_notifications BOOLEAN DEFAULT TRUE,
    match_invites BOOLEAN DEFAULT TRUE,
    
    -- Privacy preferences
    show_online_status BOOLEAN DEFAULT TRUE,
    show_last_seen BOOLEAN DEFAULT TRUE,
    allow_friend_requests BOOLEAN DEFAULT TRUE,
    public_profile BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
```

## Acceptance Criteria
- [ ] All user management features are supported by database schema
- [ ] Proper foreign key relationships are established with appropriate cascading
- [ ] Performance indexes are created for all frequently queried columns
- [ ] Data integrity constraints prevent invalid data entry
- [ ] Migration system handles schema updates safely with rollback capability
- [ ] All tables include proper timestamps for auditing
- [ ] Database constraints match application validation rules
- [ ] Schema supports all privacy and security requirements
- [ ] Performance testing validates query efficiency
- [ ] Backup and restore procedures work with new schema

## Dependencies
- [ ] Current database setup and basic users table
- [ ] Migration framework selection and implementation
- [ ] All other user management issues depend on this schema

## Estimated Effort
**1-2 weeks** (foundation for all other user management features)

### Breakdown:
- Schema design and implementation: 1 week
- Migration system setup: 0.5 weeks  
- Testing and validation: 0.5 weeks

## Additional Notes

### Migration Strategy:
1. **Phase 1**: Enhance existing users table
2. **Phase 2**: Add statistics and match history tables
3. **Phase 3**: Add supporting tables (sessions, preferences, etc.)
4. **Phase 4**: Add indexes and constraints
5. **Phase 5**: Data migration and validation

### Performance Considerations:
- Composite indexes for common query patterns
- Partitioning for large tables (match_history)
- Regular maintenance procedures (VACUUM, ANALYZE)
- Query optimization for complex joins
- Connection pooling configuration

### Security Considerations:
- Encrypted storage for sensitive data (2FA secrets)
- Audit logging for schema changes  
- Access controls for migration procedures
- Backup encryption and secure storage
- SQL injection prevention in all queries

This comprehensive schema forms the foundation for all user management features while ensuring scalability, security, and maintainability.