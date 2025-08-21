interface JoinResponse {
    status: 'waiting' | 'matched';
    playerId: string;
    gameId?: string;
    opponent?: string;
    message?: string;
    error?: string;
}

async function joinGame(): Promise<void> {
    const nameInput = document.getElementById('playerName') as HTMLInputElement;
    const resultDiv = document.getElementById('result') as HTMLDivElement;
    const name = nameInput.value;

    if (!name) {
        resultDiv.innerHTML = '<span style="color: red;">Please enter your name</span>';
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/join', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: name })
        });

        const result: JoinResponse = await response.json();

        if (response.ok) {
            if (result.status === 'waiting') {
                resultDiv.innerHTML = `
                    <div style="color: blue;">
                        <h3>Waiting for opponent...</h3>
                        <p>Player ID: ${result.playerId}</p>
                        <p>Status: ${result.message || 'Waiting...'}</p>
                    </div>
                `;
            } else if (result.status === 'matched') {
                resultDiv.innerHTML = `
                    <div style="color: green;">
                        <h3>Match Found! 🎉</h3>
                        <p>Your ID: ${result.playerId}</p>
                        <p>Game ID: ${result.gameId}</p>
                        <p>Opponent: ${result.opponent}</p>
                    </div>
                `;
            }
        } else {
            resultDiv.innerHTML = `<span style="color: red;">Error: ${result.error}</span>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<span style="color: red;">Network error: ${(error as Error).message}</span>`;
    }
}

// Make function globally available
(window as any).joinGame = joinGame;
