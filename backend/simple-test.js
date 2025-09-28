// Simple Database Schema Test
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Database } = sqlite3.verbose();
const dbPath = path.join(__dirname, 'simple-test.sqlite');
const db = new Database(dbPath);

console.log('🧪 Simple Database Schema Test');
console.log('==============================');

db.serialize(() => {
  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON;');

  // Create users table
  console.log('\n📋 Creating Users Table...');
  db.run(`
    CREATE TABLE "user" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "username" varchar(30) NOT NULL,
      "email" varchar(255) NOT NULL,
      "password_hash" text NOT NULL,
      "display_name" varchar(50) NULL,
      "first_name" varchar(50) NULL,
      "last_name" varchar(50) NULL,
      "online_status" varchar(20) NOT NULL DEFAULT 'offline',
      "role" varchar(20) NOT NULL DEFAULT 'user',
      "is_verified" boolean NOT NULL DEFAULT false,
      "created_at" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `, (err) => {
    if (err) {
      console.error('❌ Error creating users table:', err.message);
    } else {
      console.log('✅ Users table created successfully');
    }
  });

  // Create user_statistics table
  console.log('\n📊 Creating User Statistics Table...');
  db.run(`
    CREATE TABLE "user_statistics" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "user_id" integer NOT NULL,
      "total_games" integer NOT NULL DEFAULT 0,
      "wins" integer NOT NULL DEFAULT 0,
      "losses" integer NOT NULL DEFAULT 0,
      "win_percentage" decimal(5,2) NOT NULL DEFAULT 0.00,
      "current_rating" integer NOT NULL DEFAULT 1000,
      "highest_rating" integer NOT NULL DEFAULT 1000,
      "created_at" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "user_statistics_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE
    );
  `, (err) => {
    if (err) {
      console.error('❌ Error creating user_statistics table:', err.message);
    } else {
      console.log('✅ User statistics table created successfully');
    }
  });

  // Create indexes
  console.log('\n🔍 Creating Indexes...');
  db.run('CREATE UNIQUE INDEX "user_username_unique" ON "user" ("username");', (err) => {
    if (err) console.error('❌ Username index error:', err.message);
    else console.log('✅ Username unique index created');
  });

  db.run('CREATE UNIQUE INDEX "user_email_unique" ON "user" ("email");', (err) => {
    if (err) console.error('❌ Email index error:', err.message);
    else console.log('✅ Email unique index created');
  });

  db.run('CREATE INDEX "user_online_status_index" ON "user" ("online_status");', (err) => {
    if (err) console.error('❌ Online status index error:', err.message);
    else console.log('✅ Online status index created');
  });

  // Insert test users
  console.log('\n👥 Inserting Test Users...');
  db.run(`
    INSERT INTO "user" (
      username, email, password_hash, display_name, 
      first_name, last_name, online_status, role
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'alice_gamer', 'alice@example.com', 'hashed_password_123', 'Alice the Gamer',
    'Alice', 'Johnson', 'online', 'user'
  ], function(err) {
    if (err) {
      console.error('❌ Error inserting Alice:', err.message);
    } else {
      console.log('✅ Alice created with ID:', this.lastID);
      
      // Create statistics for Alice
      db.run(`
        INSERT INTO "user_statistics" (
          user_id, total_games, wins, losses, current_rating, win_percentage
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [this.lastID, 10, 7, 3, 1025, 70.00], (err) => {
        if (err) {
          console.error('❌ Error creating Alice statistics:', err.message);
        } else {
          console.log('✅ Alice statistics created');
        }
      });
    }
  });

  db.run(`
    INSERT INTO "user" (
      username, email, password_hash, display_name, 
      first_name, last_name, online_status, role
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'bob_champion', 'bob@example.com', 'hashed_password_456', 'Bob Champion',
    'Bob', 'Smith', 'in_game', 'user'
  ], function(err) {
    if (err) {
      console.error('❌ Error inserting Bob:', err.message);
    } else {
      console.log('✅ Bob created with ID:', this.lastID);
      
      // Create statistics for Bob
      db.run(`
        INSERT INTO "user_statistics" (
          user_id, total_games, wins, losses, current_rating, win_percentage
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [this.lastID, 15, 12, 3, 1150, 80.00], (err) => {
        if (err) {
          console.error('❌ Error creating Bob statistics:', err.message);
        } else {
          console.log('✅ Bob statistics created');
        }
      });
    }
  });

  // Test queries
  console.log('\n🔍 Testing Queries...');
  
  // Query 1: Get all users with their statistics
  db.all(`
    SELECT 
      u.username,
      u.display_name,
      u.online_status,
      u.role,
      s.total_games,
      s.wins,
      s.losses,
      s.win_percentage,
      s.current_rating
    FROM "user" u
    LEFT JOIN "user_statistics" s ON u.id = s.user_id
    ORDER BY s.current_rating DESC
  `, (err, rows) => {
    if (err) {
      console.error('❌ Query failed:', err.message);
    } else {
      console.log('\n📊 Users with Statistics:');
      console.log('========================');
      rows.forEach(user => {
        console.log(`👤 ${user.username} (${user.display_name})`);
        console.log(`   Status: ${user.online_status} | Role: ${user.role}`);
        console.log(`   Games: ${user.total_games} | Wins: ${user.wins} | Losses: ${user.losses}`);
        console.log(`   Win Rate: ${user.win_percentage}% | Rating: ${user.current_rating}`);
        console.log('');
      });
    }
  });

  // Query 2: Get online users only
  db.all(`
    SELECT username, display_name, online_status, last_seen
    FROM "user" 
    WHERE online_status != 'offline'
    ORDER BY last_seen DESC
  `, (err, rows) => {
    if (err) {
      console.error('❌ Online users query failed:', err.message);
    } else {
      console.log('\n🟢 Online Users:');
      console.log('================');
      rows.forEach(user => {
        console.log(`👤 ${user.username} - ${user.display_name} (${user.online_status})`);
      });
    }
  });

  // Test constraints
  console.log('\n🔒 Testing Constraints...');
  
  // Test unique username
  db.run(`
    INSERT INTO "user" (username, email, password_hash)
    VALUES ('alice_gamer', 'duplicate@example.com', 'hash')
  `, (err) => {
    if (err) {
      console.log('✅ Unique username constraint working - duplicate rejected');
    } else {
      console.log('❌ Unique username constraint failed');
    }
  });

  // Test foreign key constraint
  db.run(`
    INSERT INTO "user_statistics" (user_id, total_games)
    VALUES (999, 5)
  `, (err) => {
    if (err) {
      console.log('✅ Foreign key constraint working - invalid user_id rejected');
    } else {
      console.log('❌ Foreign key constraint failed');
    }
  });

  // Test business logic - update win percentage
  console.log('\n🧮 Testing Business Logic...');
  db.run(`
    UPDATE "user_statistics" 
    SET 
      total_games = 20,
      wins = 15,
      win_percentage = ROUND((wins * 100.0 / total_games), 2)
    WHERE user_id = 1
  `, (err) => {
    if (err) {
      console.error('❌ Win percentage update failed:', err.message);
    } else {
      console.log('✅ Win percentage calculated and updated');
      
      // Show updated statistics
      db.get(`
        SELECT username, total_games, wins, win_percentage, current_rating
        FROM "user" u
        JOIN "user_statistics" s ON u.id = s.user_id
        WHERE u.id = 1
      `, (err, row) => {
        if (err) {
          console.error('❌ Query failed:', err.message);
        } else {
          console.log(`📈 Updated stats for ${row.username}:`);
          console.log(`   Games: ${row.total_games} | Wins: ${row.wins} | Win Rate: ${row.win_percentage}%`);
        }
      });
    }
  });

  // Cleanup
  setTimeout(() => {
    console.log('\n🧹 Closing database...');
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message);
      } else {
        console.log('✅ Database closed successfully');
        console.log('\n🎉 Schema test completed successfully!');
        console.log('📁 Test database saved as: simple-test.sqlite');
        console.log('\n📋 What you can do next:');
        console.log('1. Open simple-test.sqlite with a SQLite browser');
        console.log('2. Run SQL queries to explore your data');
        console.log('3. Test more complex scenarios');
        console.log('4. Build API endpoints using this schema');
      }
    });
  }, 3000);
});
