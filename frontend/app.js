class PongGame {

    constructor() {
        this.form = document.getElementById('joinGameForm');
        this.playerNameInput = document.getElementById('playerName');
        this.joinBtn = document.getElementById('joinBtn');
        this.loading = document.getElementById('loading');
        this.errorMessage = document.getElementById('errorMessage');
        this.successMessage = document.getElementById('successMessage');
        this.gameId = ""
        this.playerId = 0
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleJoinGame();
        });

        // Real-time validation
        this.playerNameInput.addEventListener('input', () => {
            this.validatePlayerName();
        });

        // Clear messages when user starts typing
        this.playerNameInput.addEventListener('focus', () => {
            this.hideMessages();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === "ArrowUp"){
                this.sendPaddleMove(this.gameId, this.playerId,10)
            }
            else if (event.key === "ArrowDown"){
                this.sendPaddleMove(this.gameId, this.playerId,-10)
            }
        })
    }

    sendMsgToServer(msg){
        if (this.ws && this.ws.readyState == WebSocket.OPEN){
            this.ws.send(JSON.stringify(msg))
            console.log("Sent to server: ", msg)
        }
    }

    sendPaddleMove(gameId, playerId, deltaY) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message = {
                type: "paddle_move",
                gameId: gameId,
                playerId: playerId,
                deltaY: deltaY   // just send change in Y
            }
            this.ws.send(JSON.stringify(message))
            console.log("Sent paddle move:", message)
        }
    }

    validatePlayerName() {
        const name = this.playerNameInput.value.trim();
        const isValid = name.length >= 2 && name.length <= 20 && /^[a-zA-Z0-9_-]+$/.test(name);

        this.joinBtn.disabled = !isValid;

        if (name.length > 0 && !isValid) {
            this.showError('Name must be 2-20 characters, alphanumeric, underscore, or hyphen only');
        } else {
            this.hideMessages();
        }

        return isValid;
    }

    async handleJoinGame() {
        if (!this.validatePlayerName()) {
            this.showError('Please enter a valid player name');
            return;
        }

        const playerName = this.playerNameInput.value.trim();

        try {
            this.setLoadingState(true);
            this.playerId = Math.random().toString().substring(2,7)
            console.log('PlayerID: ', this.playerId)
            const response = await fetch('/api/join-classic', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    playerName: playerName,
                    playerId: this.playerId,
                    timestamp: new Date().toISOString()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to join game');
            }

            console.log('=== SERVER RESPONSE ===');
            console.log('Status Code:', response.status);
            console.log('Response Data:', data);
            console.log('Game Status:', data.status);
            console.log('Player ID:', data.playerId);
            console.log('=======================');
            // Success - handle the response
            this.handleJoinSuccess(data);

        } catch (error) {
            console.error('Join game error:', error);
            this.showError(error.message || 'Failed to join game. Please try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    connectWebSocket(playerId) {
        console.log(`Attempting to connect WebSocket with playerId: ${playerId}`)
        this.ws = new WebSocket(`ws://localhost:8080?playerId=${playerId}`)

        this.ws.onopen = () => {
            console.log('WebSocket connected successfully')
        }

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data)
            console.log('WebSocket message received:', data)

            if (data.status === 'playing'){
                this.gameId = data.id
                this.showGameMatched(data)
                const msg = {
                    type: "ready",
                    gameId: this.gameId,
                    playerId: this.playerId
                }
                setTimeout(this.sendMsgToServer(msg), 1000)
            }

        }

        this.ws.onclose = () => {
            console.log('WebSocket disconnected')
        }

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error)
            this.showError('Connection failed. Please try again.')
        }
    }


    handleJoinSuccess(data) {
        console.log('Game data:', data);

        if (data.status === 'waiting') {
            this.showSuccess('Waiting for another player to join...')
            this.connectWebSocket(data.playerId) // Connect WebSocket when waiting
        } else if (data.status === 'connected') {
            this.gameId = data.id
            this.connectWebSocket(data.playerId)
            this.showSuccess('Connecting to game...')
        }
    }

    showGameMatched(data) {
        this.showSuccess(`Game found! Players matched - Game starting...`)

        setTimeout(() => {
            this.displayGameInfo(data)
        }, 1000)
    }

    displayGameInfo(data) {
        const gameInfo = `
            <div class="game-info">
                <h3>🎮 PLAYING</h3>
                <div class="players-info">
                    <p><strong>Game ID:</strong> ${data.id}</p>
                    <p><strong>Player :</strong> ${data.player1 ? data.player1.name : 'Unknown'}</p>
                    <p><strong>Opponent :</strong> ${data.player2 ? data.player2.name : 'Unknown'}</p>
                </div>
            </div>
        `;
        console.log(data)
        this.successMessage.innerHTML = gameInfo;
        this.successMessage.style.display = 'block';

        // Start the actual game
        setTimeout(() => {
            this.startGame(data);
        }, 2000);
    }


    startGame(gameData) {
        // Placeholder for game initialization
        console.log('Starting game with data:', gameData);



        // You could:
        // 1. Hide the form and show the game canvas
        // 2. Initialize WebSocket connection for real-time gameplay
        // 3. Set up game loop and rendering
        console.log('Game initialized - ready for gameplay');
    }

    setLoadingState(isLoading) {
        this.loading.style.display = isLoading ? 'block' : 'none';
        this.form.style.display = isLoading ? 'none' : 'block';
        this.hideMessages();
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        this.successMessage.style.display = 'none';
    }

    showSuccess(message) {
        this.successMessage.textContent = message;
        this.successMessage.style.display = 'block';
        this.errorMessage.style.display = 'none';
    }

    hideMessages() {
        this.errorMessage.style.display = 'none';
        this.successMessage.style.display = 'none';
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PongGame();
});

// Handle browser navigation (for SPA routing)
window.addEventListener('popstate', (event) => {
    // Handle back/forward navigation if needed
    console.log('Navigation event:', event);
});
