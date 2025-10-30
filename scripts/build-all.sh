#!/bin/bash

# Build all microservices for production

echo "🏗️  Building all ft_transcendence microservices..."

build_service() {
    local service_name=$1
    
    echo "Building $service_name..."
    cd "services/$service_name"
    
    if [ -f "package.json" ]; then
        npm install
        npm run build
        
        if [ $? -eq 0 ]; then
            echo "✅ $service_name built successfully"
        else
            echo "❌ Failed to build $service_name"
            exit 1
        fi
    else
        echo "⚠️  No package.json found for $service_name"
    fi
    
    cd ../..
}

# Build all services
build_service "gateway"
build_service "auth-service"
build_service "user-service"
build_service "game-service"
build_service "tournament-service"

echo "🎉 All services built successfully!"
