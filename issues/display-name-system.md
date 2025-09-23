---
name: Display Name Selection for Tournaments
about: Implement unique display name system for tournament participation
title: 'feat (user): display name selection for tournaments'
labels: ['enhancement', 'user-management', 'tournament']
assignees: ''
---

## Feature Description
Implement a system allowing users to select unique display names specifically for tournament participation, separate from their username, as required by the ft_transcendence subject.

## Requirements
- [ ] Users can set a display name different from their username
- [ ] Display names must be unique within tournaments
- [ ] Real-time validation and availability checking
- [ ] Display name reservation system for tournament registration
- [ ] Tournament-specific display name management

## Implementation Steps

### Backend Implementation
- [ ] **Database Schema Updates**
  - Add `display_name` column to users table (VARCHAR(50))
  - Create `tournament_participants` table linking users and tournaments
  - Add `tournament_display_names` table for tournament-specific uniqueness
  - Add `display_name_history` table for tracking changes
  - Implement unique constraints for display names within tournaments

- [ ] **Display Name Validation Service**
  - Real-time uniqueness checking within tournament context
  - Display name format validation (3-50 characters, alphanumeric + spaces/hyphens)
  - Profanity filter integration using word lists
  - Reserved name protection (admin, system, tournament, etc.)
  - Case-insensitive duplicate detection

- [ ] **Display Name API Endpoints**
  - `GET /api/v1/users/me/display-name` - Get current display name
  - `PUT /api/v1/users/me/display-name` - Set/update display name
  - `POST /api/v1/tournaments/:id/check-display-name` - Check name availability in tournament
  - `POST /api/v1/tournaments/:id/reserve-display-name` - Reserve name during registration
  - `GET /api/v1/tournaments/:id/participants` - List tournament participants with display names
  - `GET /api/v1/users/me/display-name/suggestions` - Get alternative suggestions

- [ ] **Tournament Integration Service**
  - Display name reservation during tournament registration
  - Display name conflict resolution with alternative suggestions
  - Tournament participant management with display names
  - Display name release when leaving tournaments
  - Historical tracking of display name usage in tournaments

### Frontend Implementation
- [ ] **Display Name Management Interface**
  - Display name input field with real-time validation
  - Visual availability indicators (checkmark, X, loading spinner)
  - Display name preview in tournament context
  - Change confirmation dialog with impact warning
  - Display name format requirements display

- [ ] **Tournament Registration Integration**
  - Display name selection step during tournament signup
  - Alternative name suggestions if chosen name is taken
  - Display name confirmation before final registration
  - Tournament context display showing where name will appear
  - Conflict resolution interface with suggested alternatives

- [ ] **Display Name Suggestions System**
  - Algorithm-generated alternatives (name + numbers, variations)
  - Related name suggestions based on user preferences
  - Random name generator for inspiration
  - Popular name patterns based on gaming conventions

### Testing Requirements
- [ ] **Unit Tests**
  - Display name validation functions
  - Uniqueness checking algorithms
  - Profanity filter effectiveness
  - Name suggestion algorithms

- [ ] **Integration Tests**
  - Tournament registration with display names
  - Display name conflict resolution
  - Real-time availability checking
  - Database constraint enforcement

- [ ] **End-to-End Tests**
  - Complete tournament registration workflow
  - Display name changes and tournament updates
  - Multiple users attempting same display name
  - Display name history and tracking

- [ ] **Performance Tests**
  - Real-time validation response times
  - Concurrent display name checking
  - Large tournament participant queries
  - Name suggestion generation speed

## Acceptance Criteria
- [ ] Users can set a display name separate from their username
- [ ] Display names are enforced as unique within each tournament
- [ ] Real-time validation provides immediate feedback during name entry
- [ ] Display names appear correctly in tournament listings and match displays
- [ ] Users can change display names between tournaments without conflicts
- [ ] Proper handling of display name conflicts with helpful alternatives
- [ ] Display name history is maintained for audit purposes
- [ ] Display names respect character limits and format requirements
- [ ] Profanity filter prevents inappropriate display names
- [ ] Display names are case-insensitive for uniqueness checking

## Dependencies
- [ ] Issue #7: Database schema improvements (tournament tables)
- [ ] Tournament system implementation (external dependency)
- [ ] Issue #5: User CRUD operations (profile management integration)
- [ ] Profanity filter library or service

## Estimated Effort
**1-2 weeks** (depending on tournament system integration complexity)

### Breakdown:
- Backend implementation: 1 week
- Frontend implementation: 0.5 weeks
- Testing and integration: 0.5 weeks

## Additional Notes

### Display Name Rules:
- **Length**: 3-50 characters
- **Characters**: Alphanumeric, spaces, hyphens, underscores
- **Case**: Case-insensitive uniqueness, but preserves user's preferred casing
- **Reserved**: System reserves common terms (admin, system, tournament, game, etc.)
- **Profanity**: Filtered using comprehensive word lists and pattern detection

### Suggestion Algorithm:
1. **Numeric Suffixes**: Add numbers (1, 2, 3, etc.) to desired name
2. **Character Substitution**: Replace characters with similar ones (o→0, i→1, etc.)
3. **Word Variations**: Add gaming-related prefixes/suffixes (Player, Gamer, Pro, etc.)
4. **Random Generation**: Generate completely new suggestions based on patterns
5. **User History**: Suggest variations of previously used names

### Tournament Integration Points:
- **Registration**: Display name selection as required step
- **Brackets**: Show display names in tournament brackets
- **Matches**: Use display names in match interfaces
- **Leaderboards**: Display rankings with display names
- **Notifications**: Reference users by display names in tournament context

### Privacy Considerations:
- Display names are public within tournament context
- Option to use username as display name (if unique)
- Display name history visible only to user and admins
- No personal information should be derivable from display names

### Edge Cases Handling:
- User leaves tournament: Release display name for others
- Tournament cancellation: Clean up reserved display names
- Multiple tournament participation: Same display name across tournaments (if available)
- Display name changes: Update all tournament references
- Account deletion: Remove display name reservations

### Future Enhancements:
- Display name themes or categories
- Custom display name colors or styling
- Display name achievements or badges
- Social features around popular display names
- Display name marketplace or trading system

### Security Considerations:
- Rate limiting on display name changes
- Prevent display name squatting
- Monitor for coordinated harassment via display names
- Audit trail for display name changes
- Admin override capabilities for inappropriate names

This feature enhances the tournament experience by allowing users to have unique identities within the competitive gaming context while maintaining their primary username for the platform.