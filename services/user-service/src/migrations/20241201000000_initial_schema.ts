import { Migration } from '@mikro-orm/migrations';

export class Migration20241201000000 extends Migration {

  async up(): Promise<void> {
    // Create users table
    this.addSql(`CREATE TABLE "user" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "username" varchar(30) NOT NULL,
      "password_hash" text NOT NULL,
      "avatar_url" text NULL,
      "online_status" varchar(20) NOT NULL DEFAULT 'offline',
      "activity_type" varchar(50) NULL,
      "role" varchar(20) NOT NULL DEFAULT 'user',
      "two_factor_enabled" boolean NOT NULL DEFAULT false,
      "two_factor_secret" text NULL,
      "backup_codes" text NULL,
      "last_login" datetime NULL
    );`);

    this.addSql(`CREATE UNIQUE INDEX "user_username_unique" ON "user" ("username");`);
    this.addSql(`CREATE INDEX "user_online_status_index" ON "user" ("online_status");`);

    // Create user_statistics table
    this.addSql(`CREATE TABLE "user_statistics" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "user_id" integer NOT NULL,
      "total_games" integer NOT NULL DEFAULT 0,
      "wins" integer NOT NULL DEFAULT 0,
      "losses" integer NOT NULL DEFAULT 0,
      "draws" integer NOT NULL DEFAULT 0,
      "average_game_duration" integer NOT NULL DEFAULT 0,
      "longest_game" integer NOT NULL DEFAULT 0,
      "best_win_streak" integer NOT NULL DEFAULT 0,
      "current_rating" integer NOT NULL DEFAULT 1000,
      "highest_rating" integer NOT NULL DEFAULT 1000,
      "rating_change" integer NOT NULL DEFAULT 0,
      "created_at" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "last_game_at" datetime NULL,
      FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE
    );`);

    this.addSql(`CREATE UNIQUE INDEX "user_statistics_user_id_unique" ON "user_statistics" ("user_id");`);
    this.addSql(`CREATE INDEX "user_statistics_current_rating_index" ON "user_statistics" ("current_rating");`);
    this.addSql(`CREATE INDEX "user_statistics_wins_index" ON "user_statistics" ("wins");`);
    this.addSql(`CREATE INDEX "user_statistics_updated_at_index" ON "user_statistics" ("updated_at");`);

    // Create match_history table
    this.addSql(`CREATE TABLE "match_history" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "user_id" integer NOT NULL,
      "opponent_id" integer NOT NULL,
      "tournament_id" integer NULL,
      "tournament_won" boolean NULL,
      "result" varchar(10) NOT NULL,
      "user_score" integer NOT NULL DEFAULT 0,
      "opponent_score" integer NOT NULL DEFAULT 0,
      "start_time" datetime NULL,
      "end_time" datetime NULL,
      "played_at" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE,
      FOREIGN KEY ("opponent_id") REFERENCES "user" ("id") ON DELETE CASCADE
    );`);

    this.addSql(`CREATE INDEX "match_history_user_id_index" ON "match_history" ("user_id");`);
    this.addSql(`CREATE INDEX "match_history_opponent_id_index" ON "match_history" ("opponent_id");`);
    this.addSql(`CREATE INDEX "match_history_played_at_index" ON "match_history" ("played_at");`);
    this.addSql(`CREATE INDEX "match_history_tournament_id_index" ON "match_history" ("tournament_id");`);
    this.addSql(`CREATE INDEX "match_history_result_index" ON "match_history" ("result");`);
    this.addSql(`CREATE INDEX "match_history_user_played_index" ON "match_history" ("user_id", "played_at");`);

    // Create session table Fails thou 
    this.addSql(`CREATE TABLE "session" (
      "id" varchar(255) PRIMARY KEY NOT NULL,
      "data" text NOT NULL,
      "expires_at" integer NOT NULL,
      "created_at" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`);

    this.addSql(`CREATE INDEX "session_expires_at_index" ON "session" ("expires_at");`);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "session";`);
    this.addSql(`DROP TABLE IF EXISTS "match_history";`);
    this.addSql(`DROP TABLE IF EXISTS "user_statistics";`);
    this.addSql(`DROP TABLE IF EXISTS "user";`);
  }

}