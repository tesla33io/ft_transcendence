#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

ENV_FILE=".env"
ENV_EXAMPLE=".env.example"

echo -e "${GREEN}Setting up environment...${NC}"

# Check if .env already exists
if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW} .env file already exists${NC}"
    read -p "Do you want to regenerate JWT_SECRET? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN} Keeping existing .env file${NC}"
        exit 0
    fi
fi

# Detect Docker socket path based on OS and Docker mode
DOCKER_SOCKET_PATH="/var/run/docker.sock"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Check if running in rootless mode (common on 42 school PCs)
    if [ -S "/run/user/$(id -u)/docker.sock" ]; then
        DOCKER_SOCKET_PATH="/run/user/$(id -u)/docker.sock"
        echo -e "${YELLOW} Detected rootless Docker on Linux${NC}"
    else
        echo -e "${YELLOW} Detected standard Docker on Linux${NC}"
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${YELLOW} Detected macOS${NC}"
fi

# Auto-detect network information
HOSTNAME=$(hostname)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # On Linux, get the first non-loopback IP
    LOCAL_IP=$(hostname -I | awk '{print $1}')
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # On macOS, get IP from network interface
    LOCAL_IP=$(ifconfig | grep -E "inet.*broadcast" | awk '{print $2}' | head -n1)
fi

echo -e "${GREEN} Docker socket: $DOCKER_SOCKET_PATH${NC}"
echo -e "${GREEN} Hostname: $HOSTNAME${NC}"
echo -e "${GREEN} Local IP: $LOCAL_IP${NC}"

# Generate JWT secret (64 bytes = 128 hex characters)
echo -e "${GREEN} Generating JWT secret...${NC}"
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
MATCH_HISTORY_SERVICE_TOKEN=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Prompt for Blockchain configuration (optional)
echo -e "${YELLOW} Configure blockchain service? (y/n)${NC}"
echo -e "${YELLOW} Note: You'll need a wallet with testnet AVAX tokens${NC}"
read -p "" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW} Enter your wallet private key (starts with 0x):${NC}"
    read -p "Private Key: " BLOCKCHAIN_PRIVATE_KEY
    BLOCKCHAIN_PRIVATE_KEY=${BLOCKCHAIN_PRIVATE_KEY:-your_private_key_here}
    
    echo -e "${YELLOW} Enter your deployed contract address (starts with 0x):${NC}"
    read -p "Contract Address: " CONTRACT_ADDRESS
    CONTRACT_ADDRESS=${CONTRACT_ADDRESS:-your_contract_address_here}
    
    read -p "Avalanche RPC URL (default: https://api.avax-test.network/ext/bc/C/rpc): " AVALANCHE_RPC_URL
    AVALANCHE_RPC_URL=${AVALANCHE_RPC_URL:-https://api.avax-test.network/ext/bc/C/rpc}
    
    USE_MOCK_BLOCKCHAIN="false"
else
    # Use placeholder values and enable mock
    BLOCKCHAIN_PRIVATE_KEY="your_private_key_here"
    CONTRACT_ADDRESS="your_contract_address_here"
    AVALANCHE_RPC_URL="https://api.avax-test.network/ext/bc/C/rpc"
    USE_MOCK_BLOCKCHAIN="true"
fi

# Create .env file
cat > "$ENV_FILE" << EOF
# ===== ENVIRONMENT =====
NODE_ENV=development

# ===== NETWORK CONFIGURATION =====
# Auto-detected network information for this system
LOCAL_HOSTNAME=$HOSTNAME
LOCAL_IP=$LOCAL_IP

# ===== DOCKER CONFIGURATION =====
# Auto-detected Docker socket path for this system
DOCKER_SOCKET_PATH=$DOCKER_SOCKET_PATH
UID=$(id -u)

# ===== TRAEFIK PORTS =====
# External ports that Traefik exposes to the host
TRAEFIK_HTTP_PORT=8880
TRAEFIK_HTTPS_PORT=8443
TRAEFIK_DASHBOARD_PORT=8080

# ===== JWT SECRET (Auto-generated) =====
# DO NOT COMMIT THIS FILE TO GIT
# Generated on: $(date)
JWT_SECRET=$JWT_SECRET

# ===== SERVICE TOKENS (Auto-generated) =====
MATCH_HISTORY_SERVICE_TOKEN=$MATCH_HISTORY_SERVICE_TOKEN

# ===== GAME CONSTANTS =====
GAME_HEIGHT=550
GAME_WIDTH=900
PADDLE_HEIGHT=50
PADDLE_WIDTH=10
FPS=60
PLAYER_OFFSET=20
GAME_SCORE=3

# ===== DATABASE =====
DATABASE_URL=postgresql://postgres:password@localhost:5432/pongdb
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=pongdb

# ===== INTERNAL SERVICE PORTS =====
# These are the ports services expose inside Docker containers
FRONTEND_PORT=5173
GATEWAY_PORT=3000
USER_SERVICE_PORT=8000
GAME_SERVICE_PORT=5000
AI_SERVICE_PORT=5100

# ===== BLOCKCHAIN CONFIGURATION =====
AVALANCHE_RPC_URL=$AVALANCHE_RPC_URL
BLOCKCHAIN_PRIVATE_KEY=$BLOCKCHAIN_PRIVATE_KEY
CONTRACT_ADDRESS=$CONTRACT_ADDRESS
USE_MOCK_BLOCKCHAIN=$USE_MOCK_BLOCKCHAIN
EOF

echo -e "${GREEN} .env file created successfully${NC}"
echo -e "${YELLOW}JWT_SECRET (first 32 chars): ${JWT_SECRET:0:32}...${NC}"
echo -e "${YELLOW}MATCH_HISTORY_SERVICE_TOKEN (first 32 chars): ${MATCH_HISTORY_SERVICE_TOKEN:0:32}...${NC}"
echo ""
if [[ "$USE_MOCK_BLOCKCHAIN" == "false" ]]; then
    echo -e "${GREEN}✅ Blockchain service configured (using real blockchain)${NC}"
else
    echo -e "${YELLOW}⚠️  Blockchain service using MOCK mode${NC}"
    echo -e "${YELLOW}   To enable real blockchain, edit .env and set:${NC}"
    echo -e "${YELLOW}   USE_MOCK_BLOCKCHAIN=false${NC}"
    echo -e "${YELLOW}   BLOCKCHAIN_PRIVATE_KEY=your_private_key${NC}"
    echo -e "${YELLOW}   CONTRACT_ADDRESS=your_contract_address${NC}"
fi
echo ""
echo -e "${GREEN} Setup complete! You can now run:${NC}"
echo -e "   make up    - Start services"
echo -e "   make build - Rebuild containers"
echo ""
echo -e "${GREEN} Your site will be accessible from:${NC}"
echo -e "   https://localhost:8443 (local)"
echo -e "   https://$HOSTNAME:8443 (network hostname)"
echo -e "   https://$LOCAL_IP:8443 (network IP)"
echo ""
echo -e "${GREEN} Traefik dashboard available at:${NC}"
echo -e "   http://localhost:8080"
echo ""