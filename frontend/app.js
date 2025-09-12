class PongGame {

    constructor() {
        this.form = document.getElementById('joinGameForm');
        this.playerNameInput = document.getElementById('playerName');
        this.joinClassicBtn = document.getElementById('joinClassicBtn');
        this.joinTournamentBtn = document.getElementById('joinTournamentBtn');
        this.loading = document.getElementById('loading');
        this.errorMessage = document.getElementById('errorMessage');
        this.successMessage = document.getElementById('successMessage');
        this.gameId = ""
        this.playerId = 0
        this.ws = null
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Remove form submit handler since we're using individual buttons
        this.joinClassicBtn.addEventListener('click', () => {
            this.handleJoinGame('classic');
        });

        this.joinTournamentBtn.addEventListener('click', () => {
            this.handleJoinGame('tournament');
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

        this.joinClassicBtn.disabled = !isValid;
        this.joinTournamentBtn.disabled = !isValid;

        if (name.length > 0 && !isValid) {
            this.showError('Name must be 2-20 characters, alphanumeric, underscore, or hyphen only');
        } else {
            this.hideMessages();
        }

        return isValid;
    }

    async handleJoinGame(gameMode = 'classic') {
        if (!this.validatePlayerName()) {
            this.showError('Please enter a valid player name');
            return;
        }

        const playerName = this.playerNameInput.value.trim();

        try {
            this.setLoadingState(true);
            this.playerId = Math.random().toString().substring(2,7)
            console.log('PlayerID: ', this.playerId)
            console.log('Game Mode: ', gameMode)

            // Determine API endpoint based on game mode
            const apiEndpoint = gameMode === 'tournament' ? '/api/join-tournament' : '/api/join-classic';

            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    playerName: playerName,
                    playerId: this.playerId,
                    gameMode: gameMode,
                })
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Failed to join ${gameMode} game`);
            }

            console.log('=== SERVER RESPONSE ===');
            console.log('Status Code:', response.status);
            console.log('Response Data:', data);
            console.log('Game Status:', data.status);
            console.log('Player ID:', data.playerId);
            console.log('Game Mode:', gameMode);
            console.log('=======================');
            // Success - handle the response
            this.handleJoinSuccess(data, gameMode);

        } catch (error) {
            console.error('Join game error:', error);
            this.showError(error.message || `Failed to join ${gameMode} game. Please try again.`);
        } finally {
            this.setLoadingState(false);
        }
    }

    connectWebSocket(playerId) {
        console.log(`Attempting to connect WebSocket with playerId: ${playerId}`)
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected')
            return
        }
        this.ws = new WebSocket(`ws://${window.location.hostname}:3000/ws?playerId=${playerId}`)

        this.ws.onopen = () => {
            console.log('WebSocket connected successfully')
        }

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data)
            console.log('WebSocket message received:', data)

            if (data.status === 'connected'){
                this.gameId = data.id
                this.showGameMatched(data)
                this.showSuccess('Connecting to game...')
                const msg = {
                    type: "ready",
                    gameId: this.gameId,
                    playerId: this.playerId
                }
                setTimeout(() => this.sendMsgToServer(msg), 10000)
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


    handleJoinSuccess(data, gameMode = 'classic') {
        console.log('Game data:', data);

        if (data.status === 'waiting') {
            const waitingMessage = gameMode === 'tournament'
                ? `Waiting for tournament players... (${data.playersWaiting || 1}/4)`
                : 'Waiting for another player to join...';

            this.showSuccess(waitingMessage);
            this.connectWebSocket(data.playerId); // Connect WebSocket when waiting
        } else if (data.status === 'tournament_starting') {
            this.showSuccess('Tournament starting! Prepare for your first match.');
            this.connectWebSocket(data.playerId);
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
