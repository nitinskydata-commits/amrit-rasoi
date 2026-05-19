#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "========================================================="
echo "  🚀 Starting Amrit Rasoi Infrastructure Deployer 🚀    "
echo "========================================================="

# Check requirements
command -v docker >/dev/null 2>&1 || { echo "❌ docker is required but not installed. Aborting."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ docker-compose is required but not installed. Aborting."; exit 1; }

echo "📦 Installing workspaces dependencies..."
npm install

echo "🛠️ Compiling all applications (static asset check)..."
npm run build --workspaces --if-present

echo "🐋 Spinning up microservices containers using Docker Compose..."
# Path to docker-compose file relative to project root
docker-compose -f infrastructure/docker/docker-compose.yml up -d --build

echo "✅ Deployment Successful!"
echo "📍 API Gateway serving at http://localhost:80"
echo "📍 Storefront application serving at http://localhost:3001"
echo "📍 Admin Dashboard serving at http://localhost:3000"
echo "========================================================="
