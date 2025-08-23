class PongGame {
    constructor() {
        this.form = document.getElementById('joinGameForm');
        this.playerNameInput = document.getElementById('playerName');
        this.joinBtn = document.getElementById('joinBtn');
        this.loading = document.getElementById('loading');
        this.errorMessage = document.getElementById('errorMessage');
        this.successMessage = document.getElementById('successMessage');

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

            const response = await fetch('/api/join-game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    playerName: playerName,
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

    handleJoinSuccess(data) {
        this.showSuccess(`Welcome ${data.playerName}! Game ID: ${data.gameId}`);

        // You can expand this to handle different game states
        console.log('Game data:', data);

        // Example: Redirect to game room or start game loop
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
        if (gameData.status == 'waiting')
            this.showSuccess('Wating for players...')
        else if (gameData.status == 'matched')
            this.showSuccess('Game starting soon...');
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
