// Interactive Database Explorer
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Database } = sqlite3.verbose();
const dbPath = path.join(__dirname, 'simple-test.sqlite');
const db = new Database(dbPath);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔍 Database Explorer');
console.log('===================');

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON;');

function showMenu() {
  console.log('\n📋 Available Commands:');
  console.log('1. Show all users');
  console.log('2. Show user statistics');
  console.log('3. Show online users');
  console.log('4. Add a new user');
  console.log('5. Update user statistics');
  console.log('6. Run custom SQL query');
  console.log('7. Show table schema');
  console.log('8. Exit');
  console.log('');
}

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

async function showAllUsers() {
  try {
    const users = await query(`
      SELECT 
        u.id, u.username, u.email, u.display_name, 
        u.online_status, u.role, u.created_at,
        s.total_games, s.wins, s.losses, s.win_percentage, s.current_rating
      FROM "user" u
      LEFT JOIN "user_statistics" s ON u.id = s.user_id
      ORDER BY u.id
    `);
    
    console.log('\n👥 All Users:');
    console.log('=============');
    users.forEach(user => {
      console.log(`ID: ${user.id} | ${user.username} (${user.display_name})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Status: ${user.online_status} | Role: ${user.role}`);
      if (user.total_games !== null) {
        console.log(`   Games: ${user.total_games} | Wins: ${user.wins} | Losses: ${user.losses}`);
        console.log(`   Win Rate: ${user.win_percentage}% | Rating: ${user.current_rating}`);
      }
      console.log(`   Created: ${user.created_at}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function showUserStatistics() {
  try {
    const stats = await query(`
      SELECT 
        u.username,
        s.total_games,
        s.wins,
        s.losses,
        s.win_percentage,
        s.current_rating,
        s.highest_rating
      FROM "user" u
      JOIN "user_statistics" s ON u.id = s.user_id
      ORDER BY s.current_rating DESC
    `);
    
    console.log('\n📊 User Statistics (Ranked by Rating):');
    console.log('=====================================');
    stats.forEach((stat, index) => {
      console.log(`${index + 1}. ${stat.username}`);
      console.log(`   Rating: ${stat.current_rating} (Highest: ${stat.highest_rating})`);
      console.log(`   Games: ${stat.total_games} | Win Rate: ${stat.win_percentage}%`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function showOnlineUsers() {
  try {
    const onlineUsers = await query(`
      SELECT username, display_name, online_status, created_at
      FROM "user" 
      WHERE online_status != 'offline'
      ORDER BY created_at DESC
    `);
    
    console.log('\n🟢 Online Users:');
    console.log('================');
    if (onlineUsers.length === 0) {
      console.log('No users currently online');
    } else {
      onlineUsers.forEach(user => {
        console.log(`👤 ${user.username} - ${user.display_name} (${user.online_status})`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function addNewUser() {
  try {
    const username = await askQuestion('Enter username: ');
    const email = await askQuestion('Enter email: ');
    const displayName = await askQuestion('Enter display name: ');
    const firstName = await askQuestion('Enter first name: ');
    const lastName = await askQuestion('Enter last name: ');
    const onlineStatus = await askQuestion('Enter online status (online/offline/in_game/away/busy): ');
    
    const result = await run(`
      INSERT INTO "user" (
        username, email, password_hash, display_name, 
        first_name, last_name, online_status, role
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [username, email, 'hashed_password', displayName, firstName, lastName, onlineStatus, 'user']);
    
    console.log(`✅ User ${username} created with ID: ${result.lastID}`);
    
    // Create default statistics
    await run(`
      INSERT INTO "user_statistics" (user_id, current_rating, total_games)
      VALUES (?, ?, ?)
    `, [result.lastID, 1000, 0]);
    
    console.log('✅ Default statistics created');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function updateUserStatistics() {
  try {
    const username = await askQuestion('Enter username to update: ');
    const totalGames = parseInt(await askQuestion('Enter total games: '));
    const wins = parseInt(await askQuestion('Enter wins: '));
    const losses = parseInt(await askQuestion('Enter losses: '));
    const rating = parseInt(await askQuestion('Enter new rating: '));
    
    const winPercentage = totalGames > 0 ? Math.round((wins / totalGames) * 100 * 100) / 100 : 0;
    
    await run(`
      UPDATE "user_statistics" 
      SET 
        total_games = ?,
        wins = ?,
        losses = ?,
        win_percentage = ?,
        current_rating = ?,
        highest_rating = MAX(highest_rating, ?),
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = (
        SELECT id FROM "user" WHERE username = ?
      )
    `, [totalGames, wins, losses, winPercentage, rating, rating, username]);
    
    console.log(`✅ Statistics updated for ${username}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function runCustomQuery() {
  try {
    const sql = await askQuestion('Enter SQL query: ');
    const rows = await query(sql);
    
    console.log('\n📊 Query Results:');
    console.log('=================');
    if (rows.length === 0) {
      console.log('No results found');
    } else {
      console.table(rows);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function showTableSchema() {
  try {
    const tables = await query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    
    console.log('\n📋 Database Tables:');
    console.log('==================');
    
    for (const table of tables) {
      console.log(`\n📄 Table: ${table.name}`);
      const columns = await query(`PRAGMA table_info(${table.name})`);
      columns.forEach(col => {
        console.log(`   ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function handleCommand(choice) {
  switch (choice) {
    case '1':
      await showAllUsers();
      break;
    case '2':
      await showUserStatistics();
      break;
    case '3':
      await showOnlineUsers();
      break;
    case '4':
      await addNewUser();
      break;
    case '5':
      await updateUserStatistics();
      break;
    case '6':
      await runCustomQuery();
      break;
    case '7':
      await showTableSchema();
      break;
    case '8':
      console.log('👋 Goodbye!');
      rl.close();
      db.close();
      process.exit(0);
      break;
    default:
      console.log('❌ Invalid choice. Please try again.');
  }
}

async function main() {
  console.log('Welcome to the Database Explorer!');
  console.log('This tool lets you interact with your user management schema.');
  
  while (true) {
    showMenu();
    const choice = await askQuestion('Enter your choice (1-8): ');
    await handleCommand(choice);
  }
}

main().catch(console.error);
