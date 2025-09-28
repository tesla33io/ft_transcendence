import { Migration } from '@mikro-orm/migrations';

export class Migration20241201000000 extends Migration {

  async up(): Promise<void> {
    // Create users table
    this.addSql(`
      CREATE TABLE "user" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "username" varchar(30) NOT NULL,
        "email" varchar(255) NOT NULL,
        "password_hash" text NOT NULL,
        "display_name" varchar(50) NULL,
        "first_name" varchar(50) NULL,
        "last_name" varchar(50) NULL,
        "bio" text NULL,
        "location" varchar(100) NULL,
        "avatar_url" text NULL,
        "has_custom_avatar" boolean NOT NULL DEFAULT false,
        "avatar_upload_date" datetime NULL,
        "online_status" varchar(20) NOT NULL DEFAULT 'offline',
        "activity_type" varchar(50) NULL,
        "last_seen" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "last_activity" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "role" varchar(20) NOT NULL DEFAULT 'user',
        "is_verified" boolean NOT NULL DEFAULT false,
        "is_locked" boolean NOT NULL DEFAULT false,
        "failed_login_attempts" integer NOT NULL DEFAULT 0,
        "locked_until" datetime NULL,
        "two_factor_enabled" boolean NOT NULL DEFAULT false,
        "two_factor_secret" text NULL,
        "backup_codes" text NULL,
        "profile_visibility" varchar(20) NOT NULL DEFAULT 'public',
        "status_visibility" varchar(20) NOT NULL DEFAULT 'friends',
        "match_history_visibility" varchar(20) NOT NULL DEFAULT 'friends',
        "created_at" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "email_verified_at" datetime NULL,
        "last_login" datetime NULL
      );
    `);

    // Create indexes for users table
    this.addSql(`CREATE UNIQUE INDEX "user_username_unique" ON "user" ("username");`);
    this.addSql(`CREATE UNIQUE INDEX "user_email_unique" ON "user" ("email");`);
    this.addSql(`CREATE INDEX "user_online_status_index" ON "user" ("online_status");`);
    this.addSql(`CREATE INDEX "user_last_seen_index" ON "user" ("last_seen");`);
    this.addSql(`CREATE INDEX "user_created_at_index" ON "user" ("created_at");`);

    // Create user_statistics table
    this.addSql(`
      CREATE TABLE "user_statistics" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "user_id" integer NOT NULL,
        "total_games" integer NOT NULL DEFAULT 0,
        "wins" integer NOT NULL DEFAULT 0,
        "losses" integer NOT NULL DEFAULT 0,
        "draws" integer NOT NULL DEFAULT 0,
        "win_percentage" decimal(5,2) NOT NULL DEFAULT 0.00,
        "tournaments_played" integer NOT NULL DEFAULT 0,
        "tournaments_won" integer NOT NULL DEFAULT 0,
        "tournament_finals" integer NOT NULL DEFAULT 0,
        "tournament_semifinals" integer NOT NULL DEFAULT 0,
        "tournament_win_rate" decimal(5,2) NOT NULL DEFAULT 0.00,
        "average_score" decimal(5,2) NOT NULL DEFAULT 0.00,
        "highest_score" integer NOT NULL DEFAULT 0,
        "average_opponent_score" decimal(5,2) NOT NULL DEFAULT 0.00,
        "average_game_duration" integer NOT NULL DEFAULT 0,
        "shortest_game" integer NOT NULL DEFAULT 0,
        "longest_game" integer NOT NULL DEFAULT 0,
        "current_win_streak" integer NOT NULL DEFAULT 0,
        "best_win_streak" integer NOT NULL DEFAULT 0,
        "current_loss_streak" integer NOT NULL DEFAULT 0,
        "worst_loss_streak" integer NOT NULL DEFAULT 0,
        "current_rating" integer NOT NULL DEFAULT 1000,
        "highest_rating" integer NOT NULL DEFAULT 1000,
        "rating_change_last_game" integer NOT NULL DEFAULT 0,
        "games_today" integer NOT NULL DEFAULT 0,
        "games_this_week" integer NOT NULL DEFAULT 0,
        "games_this_month" integer NOT NULL DEFAULT 0,
        "total_playtime" integer NOT NULL DEFAULT 0,
        "perfect_games" integer NOT NULL DEFAULT 0,
        "comeback_wins" integer NOT NULL DEFAULT 0,
        "quick_wins" integer NOT NULL DEFAULT 0,
        "created_at" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "last_game_at" datetime NULL,
        CONSTRAINT "user_statistics_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE
      );
    `);

    // Create indexes for user_statistics table
    this.addSql(`CREATE UNIQUE INDEX "user_statistics_user_id_unique" ON "user_statistics" ("user_id");`);
    this.addSql(`CREATE INDEX "user_statistics_current_rating_index" ON "user_statistics" ("current_rating");`);
    this.addSql(`CREATE INDEX "user_statistics_wins_index" ON "user_statistics" ("wins");`);
    this.addSql(`CREATE INDEX "user_statistics_updated_at_index" ON "user_statistics" ("updated_at");`);

    // Create match_history table
    this.addSql(`
      CREATE TABLE "match_history" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "user_id" integer NOT NULL,
        "opponent_id" integer NOT NULL,
        "tournament_id" integer NULL,
        "tournament_round" varchar(50) NULL,
        "tournament_match_type" varchar(30) NULL,
        "game_type" varchar(20) NOT NULL DEFAULT '1v1',
        "game_mode" varchar(30) NOT NULL DEFAULT 'classic',
        "difficulty_level" varchar(20) NOT NULL DEFAULT 'normal',
        "result" varchar(10) NOT NULL,
        "user_score" integer NOT NULL DEFAULT 0,
        "opponent_score" integer NOT NULL DEFAULT 0,
        "game_duration" integer NULL,
        "start_time" datetime NULL,
        "end_time" datetime NULL,
        "played_at" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "game_details" text NULL,
        "replay_data" text NULL,
        "platform" varchar(20) NOT NULL DEFAULT 'web',
        "game_version" varchar(20) NULL,
        "connection_quality" varchar(20) NULL,
        "is_ranked" boolean NOT NULL DEFAULT true,
        "is_valid" boolean NOT NULL DEFAULT true,
        "notes" text NULL,
        "visibility" varchar(20) NOT NULL DEFAULT 'public',
        CONSTRAINT "match_history_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE,
        CONSTRAINT "match_history_opponent_id_foreign" FOREIGN KEY ("opponent_id") REFERENCES "user" ("id") ON DELETE CASCADE
      );
    `);

    // Create indexes for match_history table
    this.addSql(`CREATE INDEX "match_history_user_id_index" ON "match_history" ("user_id");`);
    this.addSql(`CREATE INDEX "match_history_opponent_id_index" ON "match_history" ("opponent_id");`);
    this.addSql(`CREATE INDEX "match_history_played_at_index" ON "match_history" ("played_at");`);
    this.addSql(`CREATE INDEX "match_history_tournament_id_index" ON "match_history" ("tournament_id");`);
    this.addSql(`CREATE INDEX "match_history_result_index" ON "match_history" ("result");`);
    this.addSql(`CREATE INDEX "match_history_user_played_index" ON "match_history" ("user_id", "played_at");`);

    // Create username_history table
    this.addSql(`
      CREATE TABLE "username_history" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "user_id" integer NOT NULL,
        "old_username" varchar(30) NULL,
        "new_username" varchar(30) NOT NULL,
        "changed_at" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "reason" varchar(100) NULL,
        "changed_by_user_id" integer NULL,
        "ip_address" varchar(45) NULL,
        CONSTRAINT "username_history_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE,
        CONSTRAINT "username_history_changed_by_user_id_foreign" FOREIGN KEY ("changed_by_user_id") REFERENCES "user" ("id") ON DELETE SET NULL
      );
    `);

    // Create indexes for username_history table
    this.addSql(`CREATE INDEX "username_history_user_id_index" ON "username_history" ("user_id");`);
    this.addSql(`CREATE INDEX "username_history_changed_at_index" ON "username_history" ("changed_at");`);

    // Create user_sessions table
    this.addSql(`
      CREATE TABLE "user_sessions" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "user_id" integer NOT NULL,
        "session_token" varchar(255) NOT NULL,
        "refresh_token" varchar(255) NULL,
        "ip_address" varchar(45) NULL,
        "user_agent" text NULL,
        "device_type" varchar(50) NULL,
        "location" varchar(100) NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "last_activity" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "created_at" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expires_at" datetime NOT NULL,
        CONSTRAINT "user_sessions_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE
      );
    `);

    // Create indexes for user_sessions table
    this.addSql(`CREATE UNIQUE INDEX "user_sessions_session_token_unique" ON "user_sessions" ("session_token");`);
    this.addSql(`CREATE UNIQUE INDEX "user_sessions_refresh_token_unique" ON "user_sessions" ("refresh_token");`);
    this.addSql(`CREATE INDEX "user_sessions_user_id_index" ON "user_sessions" ("user_id");`);
    this.addSql(`CREATE INDEX "user_sessions_expires_at_index" ON "user_sessions" ("expires_at");`);
    this.addSql(`CREATE INDEX "user_sessions_active_index" ON "user_sessions" ("is_active");`);

    // Create email_verification table
    this.addSql(`
      CREATE TABLE "email_verification" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "user_id" integer NOT NULL,
        "email" varchar(255) NOT NULL,
        "verification_token" varchar(255) NOT NULL,
        "is_verified" boolean NOT NULL DEFAULT false,
        "verified_at" datetime NULL,
        "created_at" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expires_at" datetime NOT NULL,
        CONSTRAINT "email_verification_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE
      );
    `);

    // Create indexes for email_verification table
    this.addSql(`CREATE UNIQUE INDEX "email_verification_verification_token_unique" ON "email_verification" ("verification_token");`);
    this.addSql(`CREATE INDEX "email_verification_user_id_index" ON "email_verification" ("user_id");`);

    // Create user_preferences table
    this.addSql(`
      CREATE TABLE "user_preferences" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "user_id" integer NOT NULL,
        "theme" varchar(20) NOT NULL DEFAULT 'light',
        "language" varchar(10) NOT NULL DEFAULT 'en',
        "timezone" varchar(50) NOT NULL DEFAULT 'UTC',
        "game_sound" boolean NOT NULL DEFAULT true,
        "game_music" boolean NOT NULL DEFAULT true,
        "game_effects" boolean NOT NULL DEFAULT true,
        "auto_ready" boolean NOT NULL DEFAULT false,
        "spectator_mode" boolean NOT NULL DEFAULT true,
        "email_notifications" boolean NOT NULL DEFAULT true,
        "push_notifications" boolean NOT NULL DEFAULT true,
        "friend_requests" boolean NOT NULL DEFAULT true,
        "tournament_notifications" boolean NOT NULL DEFAULT true,
        "match_invites" boolean NOT NULL DEFAULT true,
        "show_online_status" boolean NOT NULL DEFAULT true,
        "show_last_seen" boolean NOT NULL DEFAULT true,
        "allow_friend_requests" boolean NOT NULL DEFAULT true,
        "public_profile" boolean NOT NULL DEFAULT true,
        "created_at" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "user_preferences_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE
      );
    `);

    // Create indexes for user_preferences table
    this.addSql(`CREATE UNIQUE INDEX "user_preferences_user_id_unique" ON "user_preferences" ("user_id");`);

    // Create reserved_usernames table
    this.addSql(`
      CREATE TABLE "reserved_usernames" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "username" varchar(30) NOT NULL,
        "reason" varchar(100) NULL,
        "reserved_by_user_id" integer NULL,
        "created_at" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "reserved_usernames_username_unique" ON "reserved_usernames" ("username"),
        CONSTRAINT "reserved_usernames_reserved_by_user_id_foreign" FOREIGN KEY ("reserved_by_user_id") REFERENCES "user" ("id") ON DELETE SET NULL
      );
    `);

    // Create indexes for reserved_usernames table
    this.addSql(`CREATE INDEX "reserved_usernames_username_index" ON "reserved_usernames" ("username");`);
  }

  async down(): Promise<void> {
    // Drop tables in reverse order to avoid foreign key constraints
    this.addSql(`DROP TABLE IF EXISTS "reserved_usernames";`);
    this.addSql(`DROP TABLE IF EXISTS "user_preferences";`);
    this.addSql(`DROP TABLE IF EXISTS "email_verification";`);
    this.addSql(`DROP TABLE IF EXISTS "user_sessions";`);
    this.addSql(`DROP TABLE IF EXISTS "username_history";`);
    this.addSql(`DROP TABLE IF EXISTS "match_history";`);
    this.addSql(`DROP TABLE IF EXISTS "user_statistics";`);
    this.addSql(`DROP TABLE IF EXISTS "user";`);
  }

}
