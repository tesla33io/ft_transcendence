#!/bin/bash

# Start only the user service

echo "🚀 Starting ft_transcendence user service..."

cd services/user-service

if [ -f "package.json" ]; then
    echo "Installing dependencies..."
    npm install
    
    echo "Starting user service on port 3002..."
    npm run dev
else
    echo "❌ No package.json found in user-service"
    exit 1
fi
