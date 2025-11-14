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

# Generate JWT secret (64 bytes = 128 hex characters)
echo -e "${GREEN} Generating JWT secret...${NC}"
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
MATCH_HISTORY_SERVICE_TOKEN=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")


# Create .env file
cat > "$ENV_FILE" << EOF
# ===== ENVIRONMENT =====
NODE_ENV=development

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

# ===== DATABASE =====
DATABASE_URL=postgresql://postgres:password@localhost:5432/pongdb
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=pongdb

# ===== SERVICE PORTS =====
GATEWAY_PORT=3000
USER_SERVICE_PORT=8000
GAME_SERVICE_PORT=5000
AI_SERVICE_PORT=5100

# ===== BLOCKCHAIN (Optional) =====
# BLOCKCHAIN_API_KEY=your-api-key-here
EOF

echo -e "${GREEN} .env file created successfully${NC}"
echo -e "${YELLOW}JWT_SECRET (first 32 chars): ${JWT_SECRET:0:32}...${NC}"
echo -e "${YELLOW}MATCH_HISTORY_SERVICE_TOKEN (first 32 chars): ${MATCH_HISTORY_SERVICE_TOKEN:0:32}...${NC}"

echo ""
echo -e "${GREEN} Setup complete! You can now run:${NC}"
echo -e "   make up    - Start services"
echo -e "   make build - Rebuild containers"
echo ""
