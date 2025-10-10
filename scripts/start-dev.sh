#!/bin/bash

# Development scripts for ft_transcendence microservices

echo "🚀 Starting ft_transcendence development environment..."

# Function to start a service
start_service() {
    local service_name=$1
    local port=$2
    
    echo "Starting $service_name on port $port..."
    cd "services/$service_name"
    
    if [ -f "package.json" ]; then
        npm install
        npm run dev &
        echo "$service_name started on port $port"
    else
        echo "⚠️  No package.json found for $service_name"
    fi
    
    cd ../..
}

# Start all services
start_service "gateway" 3000
start_service "auth-service" 3001
start_service "user-service" 3002
start_service "game-service" 3003
start_service "tournament-service" 3004

echo "✅ All services started!"
echo ""
echo "Service URLs:"
echo "  Gateway:        http://localhost:3000"
echo "  Auth Service:   http://localhost:3001"
echo "  User Service:   http://localhost:3002"
echo "  Game Service:   http://localhost:3003"
echo "  Tournament:     http://localhost:3004"
echo ""
echo "Press Ctrl+C to stop all services"
