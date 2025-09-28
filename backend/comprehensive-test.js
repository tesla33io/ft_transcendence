// Comprehensive Database Schema Test
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Database } = sqlite3.verbose();
const dbPath = path.join(__dirname, 'comprehensive-test.sqlite');
const db = new Database(dbPath);

console.log('🧪 Comprehensive Database Schema Test');
console.log('=====================================');

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON;');

db.serialize(async () => {
  try {
    // 1. Create all tables
    console.log('\n📋 Creating All Tables...');
    
    await createTable(db, 'user', `
      CREATE TABLE "user" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "username" varchar(30) NOT NULL,
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
        "last_login" datetime NULL
      );
    `);

    await createTable(db, 'user_statistics', `
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

    await createTable(db, 'match_history', `
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

    await createTable(db, 'user_sessions', `
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

    await createTable(db, 'user_preferences', `
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

    // 2. Create indexes
    console.log('\n🔍 Creating Indexes...');
    await createIndexes(db);

    // 3. Insert test data
    console.log('\n👥 Inserting Test Data...');
    await insertTestData(db);

    // 4. Test queries
    console.log('\n🔍 Testing Complex Queries...');
    await testQueries(db);

    // 5. Test business logic
    console.log('\n🧠 Testing Business Logic...');
    await testBusinessLogic(db);

    // 6. Test constraints
    console.log('\n🔒 Testing Constraints...');
    await testConstraints(db);

    console.log('\n🎉 All tests completed successfully!');
    console.log('📁 Database saved as: comprehensive-test.sqlite');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    db.close();
  }
});

// Helper functions
function createTable(db, tableName, sql) {
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => {
      if (err) {
        console.error(`❌ Error creating ${tableName} table:`, err.message);
        reject(err);
      } else {
        console.log(`✅ ${tableName} table created successfully`);
        resolve();
      }
    });
  });
}

async function createIndexes(db) {
  const indexes = [
    'CREATE UNIQUE INDEX "user_username_unique" ON "user" ("username");',
    'CREATE INDEX "user_online_status_index" ON "user" ("online_status");',
    'CREATE INDEX "user_last_seen_index" ON "user" ("last_seen");',
    'CREATE INDEX "user_created_at_index" ON "user" ("created_at");',
    'CREATE UNIQUE INDEX "user_statistics_user_id_unique" ON "user_statistics" ("user_id");',
    'CREATE INDEX "user_statistics_current_rating_index" ON "user_statistics" ("current_rating");',
    'CREATE INDEX "match_history_user_id_index" ON "match_history" ("user_id");',
    'CREATE INDEX "match_history_played_at_index" ON "match_history" ("played_at");',
    'CREATE UNIQUE INDEX "user_sessions_session_token_unique" ON "user_sessions" ("session_token");',
    'CREATE UNIQUE INDEX "user_preferences_user_id_unique" ON "user_preferences" ("user_id");'
  ];

  for (const indexSQL of indexes) {
    await new Promise((resolve, reject) => {
      db.run(indexSQL, (err) => {
        if (err) {
          console.error('❌ Error creating index:', err.message);
          reject(err);
        } else {
          console.log('✅ Index created successfully');
          resolve();
        }
      });
    });
  }
}

async function insertTestData(db) {
  // Insert users
  const users = [
    {
      username: 'alice_gamer',
      password_hash: 'hashed_password_123',
      display_name: 'Alice the Gamer',
      first_name: 'Alice',
      last_name: 'Johnson',
      online_status: 'online',
      role: 'user'
    },
    {
      username: 'bob_champion',
      password_hash: 'hashed_password_456',
      display_name: 'Bob Champion',
      first_name: 'Bob',
      last_name: 'Smith',
      online_status: 'in_game',
      role: 'user'
    },
    {
      username: 'admin_user',
      password_hash: 'hashed_password_789',
      display_name: 'Admin User',
      role: 'admin'
    }
  ];

  for (const user of users) {
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO "user" (
          username, password_hash, display_name, 
          first_name, last_name, online_status, role
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        user.username, user.password_hash, user.display_name,
        user.first_name, user.last_name, user.online_status, user.role
      ], function(err) {
        if (err) {
          console.error(`❌ Error inserting user ${user.username}:`, err.message);
          reject(err);
        } else {
          console.log(`✅ User ${user.username} created with ID: ${this.lastID}`);
          
          // Create corresponding statistics
          db.run(`
            INSERT INTO "user_statistics" (user_id, current_rating, total_games)
            VALUES (?, ?, ?)
          `, [this.lastID, 1000, 0], (err) => {
            if (err) {
              console.error(`❌ Error creating statistics for ${user.username}:`, err.message);
            } else {
              console.log(`✅ Statistics created for ${user.username}`);
            }
          });

          // Create preferences
          db.run(`
            INSERT INTO "user_preferences" (user_id, theme, language)
            VALUES (?, ?, ?)
          `, [this.lastID, 'dark', 'en'], (err) => {
            if (err) {
              console.error(`❌ Error creating preferences for ${user.username}:`, err.message);
            } else {
              console.log(`✅ Preferences created for ${user.username}`);
            }
          });

          resolve();
        }
      });
    });
  }

  // Insert some match history
  await new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO "match_history" (
        user_id, opponent_id, result, user_score, opponent_score,
        game_duration, played_at, game_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [1, 2, 'win', 15, 12, 300, new Date().toISOString(), '1v1'], (err) => {
      if (err) {
        console.error('❌ Error inserting match:', err.message);
        reject(err);
      } else {
        console.log('✅ Match history created');
        resolve();
      }
    });
  });
}

async function testQueries(db) {
  // Test 1: Get online users
  console.log('\n📊 Test 1: Online Users');
  await new Promise((resolve, reject) => {
    db.all(`
      SELECT username, display_name, online_status, created_at
      FROM "user" 
      WHERE online_status != 'offline'
      ORDER BY created_at DESC
    `, (err, rows) => {
      if (err) {
        console.error('❌ Query failed:', err.message);
        reject(err);
      } else {
        console.log('Online users:', JSON.stringify(rows, null, 2));
        resolve();
      }
    });
  });

  // Test 2: User statistics with join
  console.log('\n📊 Test 2: User Statistics');
  await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        u.username,
        u.display_name,
        s.current_rating,
        s.total_games,
        s.wins,
        s.losses,
        s.win_percentage
      FROM "user" u
      LEFT JOIN "user_statistics" s ON u.id = s.user_id
      ORDER BY s.current_rating DESC
    `, (err, rows) => {
      if (err) {
        console.error('❌ Query failed:', err.message);
        reject(err);
      } else {
        console.log('User statistics:', JSON.stringify(rows, null, 2));
        resolve();
      }
    });
  });

  // Test 3: Match history with user details
  console.log('\n📊 Test 3: Match History');
  await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        m.id,
        u1.username as player1,
        u2.username as player2,
        m.result,
        m.user_score,
        m.opponent_score,
        m.played_at
      FROM "match_history" m
      JOIN "user" u1 ON m.user_id = u1.id
      JOIN "user" u2 ON m.opponent_id = u2.id
      ORDER BY m.played_at DESC
    `, (err, rows) => {
      if (err) {
        console.error('❌ Query failed:', err.message);
        reject(err);
      } else {
        console.log('Match history:', JSON.stringify(rows, null, 2));
        resolve();
      }
    });
  });
}

async function testBusinessLogic(db) {
  // Test win percentage calculation
  console.log('\n🧮 Testing Win Percentage Calculation');
  await new Promise((resolve, reject) => {
    db.run(`
      UPDATE "user_statistics" 
      SET 
        total_games = 10,
        wins = 7,
        losses = 3,
        win_percentage = ROUND((wins * 100.0 / total_games), 2)
      WHERE user_id = 1
    `, (err) => {
      if (err) {
        console.error('❌ Update failed:', err.message);
        reject(err);
      } else {
        console.log('✅ Win percentage calculated and updated');
        resolve();
      }
    });
  });

  // Test rating update
  console.log('\n📈 Testing Rating Update');
  await new Promise((resolve, reject) => {
    db.run(`
      UPDATE "user_statistics" 
      SET 
        rating_change_last_game = 25,
        current_rating = current_rating + rating_change_last_game,
        highest_rating = MAX(highest_rating, current_rating)
      WHERE user_id = 1
    `, (err) => {
      if (err) {
        console.error('❌ Rating update failed:', err.message);
        reject(err);
      } else {
        console.log('✅ Rating updated successfully');
        resolve();
      }
    });
  });
}

async function testConstraints(db) {
  // Test unique username constraint
  console.log('\n🔒 Testing Unique Username Constraint');
  await new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO "user" (username, password_hash)
      VALUES ('alice_gamer', 'hash')
    `, (err) => {
      if (err) {
        console.log('✅ Unique username constraint working - duplicate rejected');
        resolve();
      } else {
        console.log('❌ Unique username constraint failed');
        reject(new Error('Constraint failed'));
      }
    });
  });

  // Test foreign key constraint
  console.log('\n🔒 Testing Foreign Key Constraint');
  await new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO "user_statistics" (user_id, total_games)
      VALUES (999, 5)
    `, (err) => {
      if (err) {
        console.log('✅ Foreign key constraint working - invalid user_id rejected');
        resolve();
      } else {
        console.log('❌ Foreign key constraint failed');
        reject(new Error('Constraint failed'));
      }
    });
  });
}
