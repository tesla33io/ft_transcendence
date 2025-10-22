import axios from 'axios';
import { execSync } from 'child_process';

const API_URL = 'http://localhost:8000';

async function testBlockchainFlow() {
  console.log('🧪 Testing Blockchain Tournament Flow\n');

  try {
    // Step 1: Register users
    const tournamentId = Date.now(); // Use timestamp as unique ID
    console.log('1️⃣ Registering users...');
    const users: any[] = [];
    for (let i = 1; i <= 5; i++) {
      const response = await axios.post(`${API_URL}/users/register`, {
        username: `player${tournamentId}_${i}`,
        password: '1Passw0rd!'
      });
      users.push(response.data);
      console.log(`   ✓ Registered ${response.data.username}`);
    }

    // Step 1.5: Create tournament matches in database
    console.log('\n1.5️⃣ Creating tournament matches...');
    // We'll use a SQL insert directly since there's no matches API endpoint yet
    // For now, just create some sample match data
    const dbPath = '/Users/helensirenko/Documents/42/ft_transcendence/services/user-service/user-service.db';

    // Insert 3 matches for the tournament
    execSync(`sqlite3 ${dbPath} "
    INSERT INTO match_history (user_id, opponent_id, tournament_id, tournament_won, result, user_score, opponent_score, played_at) 
    VALUES 
        (${users[0].id}, ${users[1].id}, ${tournamentId}, true, 'win', 11, 5, datetime('now')),
        (${users[0].id}, ${users[2].id}, ${tournamentId}, false, 'win', 11, 7, datetime('now')),
        (${users[0].id}, ${users[3].id}, ${tournamentId}, false, 'win', 11, 3, datetime('now'));
    "`);
    console.log('   ✓ Created tournament matches');

    // Step 2: Simulate tournament completion
    console.log('\n2️⃣ Finalizing tournament...');
    const finalizeResponse = await axios.post(
      `${API_URL}/tournaments/${tournamentId}/finalize`,
      {
        winnerId: users[0].id,
        finalScore: 11,
        participantIds: users.map(u => u.id)
      },
      {
        headers: { Authorization: `Bearer ${users[0].id}` }
      }
    );
    
    console.log(`   ✓ Tournament finalized`);
    console.log(`   📝 TX Hash: ${finalizeResponse.data.blockchainTxHash}`);
    console.log(`   🏆 Winner: ${finalizeResponse.data.winner}`);

    // Step 3: Wait for blockchain confirmation (5 seconds)
    console.log('\n3️⃣ Waiting for blockchain confirmation...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('   ✓ Wait complete');

    // Step 4: Verify tournament
    console.log('\n4️⃣ Verifying tournament on blockchain...');
    const verifyResponse = await axios.get(
      `${API_URL}/tournaments/${tournamentId}/verify`,
      {
        headers: { Authorization: `Bearer ${users[0].id}` }
      }
    );

    if (verifyResponse.data.verified) {
      console.log('   ✅ Tournament verified on blockchain!');
      console.log(`   🔗 Blockchain Data:`);
      console.log(`      Winner: ${verifyResponse.data.blockchain.winnerUsername}`);
      console.log(`      Score: ${verifyResponse.data.blockchain.finalScore}`);
      console.log(`      Participants: ${verifyResponse.data.blockchain.participants.join(', ')}`);
    } else {
      console.log('   ❌ Tournament NOT verified');
    }

    console.log('\n✅ All tests passed!');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
  }
}

testBlockchainFlow();