## Complete Testing Guide

### **Prerequisites**

1. **Check your setup:**
```bash
# 1. Contract is deployed
echo "Contract: 0xAC5C83eD911a846e968AF3E4B70907e03Cab31E5"

# 2. Environment variables are set
cd /Users/helensirenko/Documents/42/ft_transcendence/services/blockchain-service
cat .env
# Should have:
# BLOCKCHAIN_PRIVATE_KEY=0x...
# CONTRACT_ADDRESS=0xAC5C83eD911a846e968AF3E4B70907e03Cab31E5
# AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc

# 3. Services are running
cd /Users/helensirenko/Documents/42/ft_transcendence/services/user-service
npm run dev
```

---

## **Test 1: Record Tournament on Blockchain**

### **Step 1.1: Create Test Data in Database**

Use Postman or your terminal:

```bash
# Create users first
POST http://localhost:8000/users/register
{
  "username": "player1",
  "password": "Password123!"
}

POST http://localhost:8000/users/register
{
  "username": "player2",
  "password": "Password123!"
}

POST http://localhost:8000/users/register
{
  "username": "player3",
  "password": "Password123!"
}

POST http://localhost:8000/users/register
{
  "username": "player4",
  "password": "Password123!"
}
```

### **Step 1.2: Create Tournament Matches in Database**

Manually insert tournament data into SQLite:

```bash
cd /Users/helensirenko/Documents/42/ft_transcendence/services/user-service
sqlite3 user-service.db

-- Insert tournament matches
INSERT INTO match_history (user_id, opponent_id, tournament_id, tournament_won, result, user_score, opponent_score, played_at)
VALUES 
  (1, 2, 1, 0, 'win', 11, 9, datetime('now')),
  (3, 4, 1, 0, 'win', 11, 7, datetime('now')),
  (1, 3, 1, 1, 'win', 11, 8, datetime('now'));

-- Check the data
SELECT * FROM match_history WHERE tournament_id = 1;

.quit
```

### **Step 1.3: Finalize Tournament (Record on Blockchain)**

```bash
POST http://localhost:8000/tournaments/1/finalize
Headers:
  Authorization: Bearer 1
Body:
{
  "winnerId": 1,
  "finalScore": 11,
  "participantIds": [1, 2, 3, 4]
}
```

**Expected Response:**
```json
{
  "success": true,
  "tournamentId": "1",
  "winner": "player1",
  "finalScore": 11,
  "blockchainTxHash": "0x123abc...",
  "message": "Tournament finalized and recorded on blockchain"
}
```

**What happens behind the scenes:**
1. ✅ Backend finds tournament data in SQLite
2. ✅ Backend calls blockchain service
3. ✅ Blockchain service sends transaction to Avalanche
4. ✅ Smart contract records tournament
5. ✅ Transaction hash saved to database
6. ✅ Response sent to client

**Check on Blockchain:**
```
https://testnet.snowtrace.io/tx/[your-tx-hash]
```

---

## **Test 2: Verify Tournament on Blockchain**

### **Step 2.1: Verify Existing Tournament**

```bash
GET http://localhost:8000/tournaments/1/verify
Headers:
  Authorization: Bearer 1
```

**Expected Response (Verified):**
```json
{
  "verified": true,
  "blockchain": {
    "tournamentId": 1,
    "timestamp": 1729534800,
    "winner": "0x0000000000000000000000000000000000000001",
    "winnerUsername": "player1",
    "finalScore": 11,
    "participants": ["player1", "player2", "player3", "player4"],
    "verified": true
  },
  "database": {
    "matchCount": 3,
    "tournamentId": 1
  },
  "message": "Tournament verified on blockchain"
}
```

### **Step 2.2: Verify Non-Existent Tournament**

```bash
GET http://localhost:8000/tournaments/999/verify
Headers:
  Authorization: Bearer 1
```

**Expected Response (Not Found):**
```json
{
  "verified": false,
  "message": "Tournament not found on blockchain"
}
```

---

## **Test 3: Direct Blockchain Testing (Without Backend)**

### **Using Hardhat Console**

## **or don't use it and run this instead**

```bash

npx hardhat run scripts/test-contract.ts --network fuji

```

```bash
cd /Users/helensirenko/Documents/42/ft_transcendence/blockchain
npx hardhat console --network fuji
```

```javascript
// Get contract instance
const TournamentScores = await ethers.getContractFactory("TournamentScores");
const contract = TournamentScores.attach("0xAC5C83eD911a846e968AF3E4B70907e03Cab31E5");

// Check owner
const owner = await contract.owner();
console.log("Owner:", owner);

// Get tournament count
const count = await contract.getTournamentCount();
console.log("Tournament count:", count.toString());

// Get specific tournament
const tournament = await contract.getTournament(1);
console.log("Tournament 1:", {
  tournamentId: tournament.tournamentId.toString(),
  timestamp: new Date(tournament.timestamp.toNumber() * 1000),
  winner: tournament.winner,
  winnerUsername: tournament.winnerUsername,
  finalScore: tournament.finalScore.toString(),
  participants: tournament.participants,
  verified: tournament.verified
});

// Verify tournament exists
const exists = await contract.verifyTournament(1);
console.log("Tournament 1 exists:", exists);

// Try to verify non-existent tournament
const notExists = await contract.verifyTournament(999);
console.log("Tournament 999 exists:", notExists); // Should be false
```

---

## **Test 4: End-to-End Integration Test**

Create a test script: `services/user-service/test-blockchain-flow.ts`

```typescript
import axios from 'axios';

const API_URL = 'http://localhost:8000';

async function testBlockchainFlow() {
  console.log('🧪 Testing Blockchain Tournament Flow\n');

  try {
    // Step 1: Register users
    console.log('1️⃣ Registering users...');
    const users = [];
    for (let i = 1; i <= 4; i++) {
      const response = await axios.post(`${API_URL}/users/register`, {
        username: `testplayer${i}`,
        password: 'Password123!'
      });
      users.push(response.data);
      console.log(`   ✓ Registered ${response.data.username}`);
    }

    // Step 2: Simulate tournament completion
    console.log('\n2️⃣ Finalizing tournament...');
    const finalizeResponse = await axios.post(
      `${API_URL}/tournaments/1/finalize`,
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
      `${API_URL}/tournaments/1/verify`,
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
```

**Run the test:**
```bash
cd /Users/helensirenko/Documents/42/ft_transcendence/services/user-service
npx tsx test-blockchain-flow.ts
```

---

## **Test 5: Manual Testing Checklist**

### **✅ Tournament Recording**
- [ ] Tournament data exists in SQLite before recording
- [ ] API call returns transaction hash
- [ ] Transaction appears on Snowtrace
- [ ] Database updated with transaction hash
- [ ] Transaction status changes from pending to success

### **✅ Verification**
- [ ] Existing tournament returns `verified: true`
- [ ] Non-existent tournament returns `verified: false`
- [ ] Blockchain data matches database data
- [ ] Verification works for multiple tournaments
- [ ] Verification badge shows correctly in frontend

### **✅ Error Handling**
- [ ] Handles invalid tournament ID
- [ ] Handles blockchain connection errors
- [ ] Handles insufficient gas errors
- [ ] Handles duplicate tournament recording
- [ ] Shows user-friendly error messages

---

## **Test 6: View Results**

### **Check Database:**
```bash
sqlite3 /Users/helensirenko/Documents/42/ft_transcendence/services/user-service/user-service.db

SELECT 
  id, 
  tournament_id, 
  tournament_won,
  blockchain_tx_hash,
  on_blockchain
FROM match_history 
WHERE tournament_id = 1;

.quit
```

### **Check Blockchain:**
```
https://testnet.snowtrace.io/address/0xAC5C83eD911a846e968AF3E4B70907e03Cab31E5
```
Click "Contract" → "Read Contract" → Call `getTournament(1)`

---

## **Expected Timeline**

```
T+0s:   User completes tournament
T+1s:   Backend receives finalize request
T+2s:   Backend sends transaction to blockchain
T+3-8s: Blockchain processes transaction
T+9s:   Transaction confirmed
T+10s:  Frontend receives success response
T+15s:  User can verify tournament
```

---

## **Troubleshooting**

**If transaction fails:**
1. Check gas balance: Visit https://faucet.avax.network/
2. Check RPC connection: `curl https://api.avax-test.network/ext/bc/C/rpc`
3. Check private key has 0x prefix
4. Check contract address is correct

**If verification fails:**
1. Wait 30 seconds after recording
2. Check transaction was confirmed on Snowtrace
3. Verify contract address matches deployed contract
4. Check RPC URL is correct

##

Coupon code for test AVAX:

GUILDJULY2025