# Frontend Integration Guide: Blockchain Tournament Module

## Overview
The blockchain module records tournament scores on Avalanche blockchain for immutable verification. Frontend needs to display blockchain status and trigger blockchain recording.

## API Endpoints to Implement

### 1. **Finalize Tournament & Record on Blockchain**
```
POST /tournaments/:id/finalize
```

**Headers:**
```json
{
  "Authorization": "Bearer {userId}"
}
```

**Request Body:**
```json
{
  "winnerId": 1,
  "finalScore": 11,
  "participantIds": [1, 2, 3, 4]
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "tournamentId": "123",
  "winner": "player_username",
  "finalScore": 11,
  "blockchainTxHash": "0x1234...abcd",
  "message": "Tournament finalized and recorded on blockchain"
}
```

**Response (Error - 404):**
```json
{
  "error": "Tournament not found"
}
```

**When to Call:**
- After the tournament bracket is complete
- When the final winner is determined
- Before showing the "Tournament Complete" screen

---

### 2. **Verify Tournament on Blockchain**
```
GET /tournaments/:id/verify
```

**Headers:**
```json
{
  "Authorization": "Bearer {userId}"
}
```

**Response (Verified - 200):**
```json
{
  "verified": true,
  "blockchain": {
    "tournamentId": 123,
    "timestamp": 1729534800,
    "winner": "0x0000...0001",
    "winnerUsername": "player_username",
    "finalScore": 11,
    "participants": ["player1", "player2", "player3", "player4"],
    "verified": true
  },
  "database": {
    "matchCount": 3,
    "tournamentId": 123
  },
  "message": "Tournament verified on blockchain"
}
```

**Response (Not Verified - 200):**
```json
{
  "verified": false,
  "message": "Tournament not found on blockchain"
}
```

**When to Call:**
- When user clicks "Verify on Blockchain" button
- On tournament history page load
- To show verification badge

---

## UI/UX Requirements

### 1. **Tournament Completion Flow**

**After tournament ends:**
```
┌─────────────────────────────────────────┐
│   Tournament Complete!                  │
│                                         │
│   Winner: PlayerName                    │
│   Final Score: 11                       │
│                                         │
│   [Recording on Blockchain...]          │ ← Show loading state
│   ⏳ Please wait...                     │
└─────────────────────────────────────────┘

            ↓ (after API response)

┌─────────────────────────────────────────┐
│   Tournament Complete!                  │
│                                         │
│   Winner: PlayerName                    │
│   Final Score: 11                       │
│                                         │
│   ✓ Recorded on Blockchain              │ ← Success state
│   TX: 0x1234...abcd                     │
│                                         │
│   [View on Explorer]  [Close]           │
└─────────────────────────────────────────┘
```

### 2. **Tournament History Page**

**Each tournament card should show:**
```
┌─────────────────────────────────────────┐
│  Tournament #123                        │
│  Date: Oct 21, 2025                     │
│  Winner: PlayerName (Score: 11)         │
│  Participants: 4 players                │
│                                         │
│  ✓ Verified on Blockchain               │ ← Verification badge
│  [Verify Again] [View Details]          │
└─────────────────────────────────────────┘
```

### 3. **Blockchain Verification Badge**

**Show different states:**
```typescript
// Verified
<span className="blockchain-badge verified">
  ✓ Blockchain Verified
</span>

// Not Verified
<span className="blockchain-badge unverified">
  ⚠ Not on Blockchain
</span>

// Loading
<span className="blockchain-badge loading">
  ⏳ Verifying...
</span>
```

### 4. **Transaction Details**

**When user clicks transaction hash:**
- Open Avalanche Fuji Explorer
- URL: `https://testnet.snowtrace.io/tx/${txHash}`
- Open in new tab

---

## Frontend Component Examples

### 1. **Tournament Finalization Component**

```typescript
const finalizeTournament = async (tournamentId: number, winnerId: number, finalScore: number, participantIds: number[]) => {
  try {
    setIsRecordingOnBlockchain(true);
    
    const response = await fetch(`/api/tournaments/${tournamentId}/finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userId}`
      },
      body: JSON.stringify({
        winnerId,
        finalScore,
        participantIds
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      setBlockchainTxHash(data.blockchainTxHash);
      setIsRecordingOnBlockchain(false);
      showSuccessMessage('Tournament recorded on blockchain!');
    }
  } catch (error) {
    console.error('Error finalizing tournament:', error);
    showErrorMessage('Failed to record on blockchain');
    setIsRecordingOnBlockchain(false);
  }
};
```

### 2. **Blockchain Verification Component**

```typescript
const verifyTournament = async (tournamentId: number) => {
  try {
    setIsVerifying(true);
    
    const response = await fetch(`/api/tournaments/${tournamentId}/verify`, {
      headers: {
        'Authorization': `Bearer ${userId}`
      }
    });
    
    const data = await response.json();
    
    setIsVerified(data.verified);
    setBlockchainData(data.blockchain);
    setIsVerifying(false);
    
    return data.verified;
  } catch (error) {
    console.error('Error verifying tournament:', error);
    setIsVerifying(false);
    return false;
  }
};
```

### 3. **Transaction Link Component**

```typescript
const BlockchainTxLink = ({ txHash }: { txHash: string }) => {
  const explorerUrl = `https://testnet.snowtrace.io/tx/${txHash}`;
  
  return (
    <a 
      href={explorerUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className="blockchain-link"
    >
      View on Avalanche Explorer
      <ExternalLinkIcon />
    </a>
  );
};
```

---

## State Management

**You'll need to track:**

```typescript
interface TournamentState {
  tournamentId: number;
  winner: {
    id: number;
    username: string;
  };
  finalScore: number;
  participants: number[];
  
  // Blockchain states
  isRecordingOnBlockchain: boolean;
  blockchainTxHash: string | null;
  isVerified: boolean;
  isVerifying: boolean;
  blockchainData: {
    timestamp: number;
    winnerUsername: string;
    finalScore: number;
    participants: string[];
  } | null;
}
```

---

## Loading States & Error Handling

### **1. Recording on Blockchain**
- Show loading spinner
- Disable all tournament actions
- Display message: "Recording on blockchain, please wait..."
- **Duration:** ~5-10 seconds (blockchain transaction time)

### **2. Verification**
- Show loading spinner on verification badge
- Display message: "Verifying on blockchain..."
- **Duration:** ~2-3 seconds (blockchain query)

### **3. Error Scenarios**

**Blockchain Service Down:**
```json
{
  "error": "Internal server error",
  "message": "Unable to connect to blockchain"
}
```
→ Show error but allow user to continue (tournament is still in database)

**Insufficient Gas Fees:**
```json
{
  "error": "Transaction failed",
  "message": "Insufficient funds for gas"
}
```
→ Show error, log to support, tournament saved in database

**Tournament Already Recorded:**
```json
{
  "error": "Tournament already recorded"
}
```
→ Show message, fetch existing blockchain data

---

## Visual Design Suggestions

### **Colors for Blockchain Elements:**
```css
/* Verified badge */
.blockchain-verified {
  background: #10B981; /* Green */
  color: white;
}

/* Unverified badge */
.blockchain-unverified {
  background: #F59E0B; /* Orange */
  color: white;
}

/* Transaction hash */
.blockchain-tx-hash {
  font-family: monospace;
  font-size: 0.85rem;
  color: #6366F1; /* Indigo */
}

/* Loading state */
.blockchain-loading {
  background: #6B7280; /* Gray */
  color: white;
  animation: pulse 2s infinite;
}
```

### **Icons to Use:**
- ✓ Checkmark for verified
- ⚠ Warning for unverified
- ⏳ Hourglass for loading
- 🔗 Chain/link for blockchain reference
- 🔍 Magnifying glass for verify button

---

## Testing Checklist

### **Frontend Developer Should Test:**

- [ ] Tournament finalization triggers blockchain recording
- [ ] Loading state shows during blockchain transaction
- [ ] Success message appears after blockchain confirmation
- [ ] Transaction hash is displayed and clickable
- [ ] Verification badge updates correctly
- [ ] "Verify on Blockchain" button works
- [ ] Error messages display for failed transactions
- [ ] Tournament history shows blockchain status
- [ ] Explorer link opens in new tab
- [ ] All states work: loading, success, error, verified, unverified

---

## Data Flow Diagram

```
User completes tournament
        ↓
Frontend calls POST /tournaments/:id/finalize
        ↓
Backend stores in SQLite
        ↓
Backend calls Blockchain Service
        ↓
Smart Contract records on Avalanche
        ↓
Transaction hash returned to Backend
        ↓
Backend stores TX hash in SQLite
        ↓
Frontend receives TX hash
        ↓
Frontend shows "✓ Verified on Blockchain"
```

---

## Important Notes

1. **Blockchain transactions take time** (~5-10 seconds)
   - Show clear loading states
   - Don't let users navigate away during recording

2. **Tournament is saved in database first**
   - Even if blockchain fails, users don't lose data
   - Blockchain is a verification layer, not primary storage

3. **Test with Fuji Testnet**
   - All transactions are on test network
   - No real money involved
   - Can be reset/cleared if needed

4. **Transaction hashes are permanent**
   - Once on blockchain, cannot be deleted
   - Show users this is immutable proof

---