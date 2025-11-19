#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

ENV_FILE=".env"
ENV_EXAMPLE=".env.example"

echo -e "${GREEN}Setting up environment...${NC}"

# Auto-detect network information
HOSTNAME=$(hostname)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # On Linux, get the first non-loopback IP
    LOCAL_IP=$(hostname -I | awk '{print $1}')
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # On macOS, get IP from network interface
    LOCAL_IP=$(ifconfig | grep -E "inet.*broadcast" | awk '{print $2}' | head -n1)
fi

echo -e "${GREEN} Hostname: $HOSTNAME${NC}"
echo -e "${GREEN} Local IP: $LOCAL_IP${NC}"

# Generate JWT secret (64 bytes = 128 hex characters)
echo -e "${GREEN} Generating JWT secret...${NC}"
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
MATCH_HISTORY_SERVICE_TOKEN=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Prompt for Blockchain configuration (optional)
echo -e "${YELLOW} Configure blockchain service? (y/n)${NC}"
echo -e "${YELLOW} Note: You'll need a wallet with testnet AVAX tokens${NC}"

# loop until user enters y or n
while true; do
    # read single char, allow enter to be treated as empty
    read -r -n 1 -p "" RESPONSE
    echo
    # normalize empty input
    RESPONSE=${RESPONSE:-}
    if [[ $RESPONSE =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW} Enter your wallet private key (starts with 0x):${NC}"
        read -p "Private Key: " BLOCKCHAIN_PRIVATE_KEY
        BLOCKCHAIN_PRIVATE_KEY=${BLOCKCHAIN_PRIVATE_KEY:-your_private_key_here}

        echo -e "${YELLOW} Enter your deployed contract address (starts with 0x):${NC}"
        read -p "Contract Address: " CONTRACT_ADDRESS
        CONTRACT_ADDRESS=${CONTRACT_ADDRESS:-your_contract_address_here}

        read -p "Avalanche RPC URL (default: https://api.avax-test.network/ext/bc/C/rpc): " AVALANCHE_RPC_URL
        AVALANCHE_RPC_URL=${AVALANCHE_RPC_URL:-https://api.avax-test.network/ext/bc/C/rpc}

        USE_MOCK_BLOCKCHAIN="false"
        break
    elif [[ $RESPONSE =~ ^[Nn]$ ]]; then
        # Use placeholder values and enable mock
        BLOCKCHAIN_PRIVATE_KEY="your_private_key_here"
        CONTRACT_ADDRESS="your_contract_address_here"
        AVALANCHE_RPC_URL="https://api.avax-test.network/ext/bc/C/rpc"
        USE_MOCK_BLOCKCHAIN="true"
        break
    else
        echo -e "${RED}Invalid input. Please enter 'y' or 'n'.${NC}"
    fi
done

# Create .env file
cat > "$ENV_FILE" << EOF
# ===== ENVIRONMENT =====
NODE_ENV=production

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

#for treafik
echo -e "${GREEN}⚙️  Checking Traefik TLS certificates...${NC}"
mkdir -p traefik/certs

if [ ! -f "traefik/certs/cert.pem" ] || [ ! -f "traefik/certs/key.pem" ]; then
    echo -e "${GREEN}🔐 Generating self-signed TLS certificate...${NC}"

    openssl req -x509 -newkey rsa:4096 -nodes \
        -keyout traefik/certs/key.pem \
        -out traefik/certs/cert.pem \
        -days 365 \
        -subj "/CN=$HOSTNAME" \
        -addext "subjectAltName=DNS:localhost,DNS:$HOSTNAME,IP:$LOCAL_IP,IP:127.0.0.1" \
        2>/dev/null

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ TLS certificate created${NC}"
    else
        echo -e "${RED}✗ Failed to create certificate${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ TLS certificates already exist${NC}"
fi

# Generate Traefik dynamic config from template
echo -e "${GREEN}⚙️  Generating Traefik dynamic configuration...${NC}"
mkdir -p traefik/dynamic


if [ -f "traefik/dynamic/services.yml.template" ]; then
    sed -e "s/__LOCAL_HOSTNAME__/$HOSTNAME/g" \
        -e "s/__LOCAL_IP__/$LOCAL_IP/g" \
        traefik/dynamic/services.yml.template > traefik/dynamic/services.yml

    # Verify it was created
    if [ -f "traefik/dynamic/services.yml" ]; then
        echo -e "${GREEN}✓ Traefik dynamic config generated${NC}"
        # Show a sample to confirm substitution worked
        echo -e "${GREEN}  Sample rule:${NC}"
        grep "rule:" traefik/dynamic/services.yml | head -1
    else
        echo -e "${RED}✗ Failed to generate services.yml${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ Template file not found: traefik/dynamic/services.yml.template${NC}"
    echo -e "${YELLOW}  Using existing services.yml if present${NC}"
fi


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
