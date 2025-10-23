import { Migration } from '@mikro-orm/migrations';

export class Migration20251012154000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table \`user\` (\`id\` integer not null primary key autoincrement, \`username\` text not null, \`password_hash\` text not null, \`avatar_url\` text null, \`online_status\` text check (\`online_status\` in ('online', 'offline', 'away', 'in_game', 'busy')) not null default 'offline', \`activity_type\` text null, \`role\` text check (\`role\` in ('user', 'admin')) not null default 'user', \`two_factor_enabled\` integer not null default false, \`two_factor_secret\` text null, \`backup_codes\` text null, \`last_login\` datetime null);`);
    this.addSql(`create unique index \`user_username_unique\` on \`user\` (\`username\`);`);

    this.addSql(`create table \`match_history\` (\`id\` integer not null primary key autoincrement, \`user_id\` integer not null, \`opponent_id\` integer not null, \`tournament_id\` integer null, \`tournament_won\` integer null, \`result\` text not null, \`user_score\` integer not null default 0, \`opponent_score\` integer not null default 0, \`start_time\` datetime null, \`end_time\` datetime null, \`played_at\` datetime not null, constraint \`match_history_user_id_foreign\` foreign key(\`user_id\`) references \`user\`(\`id\`) on update cascade, constraint \`match_history_opponent_id_foreign\` foreign key(\`opponent_id\`) references \`user\`(\`id\`) on update cascade);`);
    this.addSql(`create index \`match_history_user_id_index\` on \`match_history\` (\`user_id\`);`);
    this.addSql(`create index \`match_history_opponent_id_index\` on \`match_history\` (\`opponent_id\`);`);

    this.addSql(`create table \`user_statistics\` (\`id\` integer not null primary key autoincrement, \`user_id\` integer not null, \`total_games\` integer not null default 0, \`wins\` integer not null default 0, \`losses\` integer not null default 0, \`draws\` integer not null default 0, \`average_game_duration\` integer not null default 0, \`longest_game\` integer not null default 0, \`best_win_streak\` integer not null default 0, \`current_rating\` integer not null default 1000, \`highest_rating\` integer not null default 1000, \`rating_change\` integer not null default 0, \`overall_tournament_won\` integer not null default 0, \`tournaments_participated\` integer not null default 0, \`created_at\` datetime not null, \`updated_at\` datetime not null, \`last_game_at\` datetime null, constraint \`user_statistics_user_id_foreign\` foreign key(\`user_id\`) references \`user\`(\`id\`) on update cascade);`);
    this.addSql(`create index \`user_statistics_user_id_index\` on \`user_statistics\` (\`user_id\`);`);
  }

}
