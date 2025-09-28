// Simple test to verify our database schema
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a new database connection
const dbPath = path.join(__dirname, 'test-database.sqlite');
const { Database } = sqlite3.verbose();
const db = new Database(dbPath);

console.log('🧪 Testing Database Schema Implementation');
console.log('==========================================');

// Test 1: Create users table
db.serialize(() => {
  // Enable foreign key constraints
  db.run('PRAGMA foreign_keys = ON;');
  
  console.log('\n📋 Creating Users Table...');
  
  db.run(`
    CREATE TABLE IF NOT EXISTS "user" (
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
  `, (err) => {
    if (err) {
      console.error('❌ Error creating users table:', err.message);
    } else {
      console.log('✅ Users table created successfully');
    }
  });

  // Test 2: Create indexes
  console.log('\n🔍 Creating Indexes...');
  
  const indexes = [
    'CREATE UNIQUE INDEX "user_username_unique" ON "user" ("username");',
    'CREATE UNIQUE INDEX "user_email_unique" ON "user" ("email");',
    'CREATE INDEX "user_online_status_index" ON "user" ("online_status");',
    'CREATE INDEX "user_last_seen_index" ON "user" ("last_seen");',
    'CREATE INDEX "user_created_at_index" ON "user" ("created_at");'
  ];

  indexes.forEach((indexSQL, i) => {
    db.run(indexSQL, (err) => {
      if (err) {
        console.error(`❌ Error creating index ${i + 1}:`, err.message);
      } else {
        console.log(`✅ Index ${i + 1} created successfully`);
      }
    });
  });

  // Test 3: Create user_statistics table
  console.log('\n📊 Creating User Statistics Table...');
  
  db.run(`
    CREATE TABLE IF NOT EXISTS "user_statistics" (
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
  `, (err) => {
    if (err) {
      console.error('❌ Error creating user_statistics table:', err.message);
    } else {
      console.log('✅ User statistics table created successfully');
    }
  });

  // Test 4: Insert test data
  console.log('\n👤 Inserting Test Data...');
  
  db.run(`
    INSERT INTO "user" (
      username, email, password_hash, display_name, 
      first_name, last_name, online_status, role
    ) VALUES (
      'testuser', 'test@example.com', 'hashedpassword123', 'Test User',
      'Test', 'User', 'online', 'user'
    );
  `, function(err) {
    if (err) {
      console.error('❌ Error inserting test user:', err.message);
    } else {
      console.log('✅ Test user created with ID:', this.lastID);
      
      // Insert corresponding statistics
      const userId = this.lastID;
      db.run(`
        INSERT INTO "user_statistics" (
          user_id, total_games, wins, losses, current_rating
        ) VALUES (
          ?, 0, 0, 0, 1000
        );
      `, [userId], (err) => {
        if (err) {
          console.error('❌ Error inserting user statistics:', err.message);
        } else {
          console.log('✅ User statistics created successfully');
          
          // Test the query after statistics are inserted
          db.all(`
            SELECT u.username, u.email, u.online_status, 
                   s.current_rating, s.total_games
            FROM "user" u
            LEFT JOIN "user_statistics" s ON u.id = s.user_id
            WHERE u.username = 'testuser';
          `, (err, rows) => {
            if (err) {
              console.error('❌ Error querying test data:', err.message);
            } else {
              console.log('✅ Query successful! Results:');
              console.log(JSON.stringify(rows, null, 2));
            }
          });
        }
      });
    }
  });

  // Test 5: Query test data (moved inside user creation callback)

  // Test 6: Test foreign key constraints
  console.log('\n🔗 Testing Foreign Key Constraints...');
  
  db.run(`
    INSERT INTO "user_statistics" (user_id, total_games) 
    VALUES (999, 5);
  `, (err) => {
    if (err) {
      console.log('✅ Foreign key constraint working - invalid user_id rejected');
    } else {
      console.log('❌ Foreign key constraint failed - invalid user_id was accepted');
    }
  });

  // Cleanup
  setTimeout(() => {
    console.log('\n🧹 Cleaning up test database...');
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message);
      } else {
        console.log('✅ Database closed successfully');
        console.log('\n🎉 Schema test completed!');
        console.log('📁 Test database saved as: test-database.sqlite');
      }
    });
  }, 2000);
});
