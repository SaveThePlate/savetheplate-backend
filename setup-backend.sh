#!/bin/bash

# SaveThePlate Backend Local Setup Script
# Sets up the NestJS backend with PostgreSQL and Redis

set -e  # Exit on any error

echo "🚀 SaveThePlate Backend Setup"
echo "=============================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo "💡 Install from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "💡 Install from: https://nodejs.org/"
    exit 1
fi

echo "✅ Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"
echo "✅ Node.js $(node --version)"
echo ""

# Check Docker daemon
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running"
    echo "💡 Start Docker Desktop and try again"
    exit 1
fi
echo "✅ Docker daemon running"
echo ""

# Setup environment
echo "📝 Setting up environment..."
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found"
    echo "💡 This file should be committed to the repo"
    exit 1
fi
echo "✅ .env.local exists"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Start Docker services (from parent directory)
echo "🐳 Starting Docker services..."
cd ..
if [ ! -f docker-compose.local.yml ]; then
    echo "❌ docker-compose.local.yml not found"
    exit 1
fi

docker-compose -f docker-compose.local.yml up -d
echo "✅ Docker services started"
echo ""

# Wait for database
echo "⏳ Waiting for PostgreSQL..."
max_attempts=12
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if docker exec savetheplate-db-local pg_isready -U savetheplate_user > /dev/null 2>&1; then
        echo "✅ PostgreSQL ready"
        break
    fi
    attempt=$((attempt + 1))
    if [ $attempt -lt $max_attempts ]; then
        sleep 3
    fi
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Database failed to start"
    echo "💡 Check logs: docker-compose -f docker-compose.local.yml logs db"
    exit 1
fi
echo ""

# Run migrations
echo "📊 Running migrations..."
cd leftover-backend
npx prisma migrate deploy
echo "✅ Migrations complete"
echo ""

# Success
echo "=============================="
echo "✅ Backend setup complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. Start backend: cd leftover-backend && npm run start:dev"
echo "   2. View DB: npx prisma studio"
echo ""
echo "📡 Services:"
echo "   • Backend: http://localhost:3001"
echo "   • PostgreSQL: localhost:5432"
echo "   • Redis: localhost:6379"
echo ""
echo "💡 Commands:"
echo "   • View logs: docker-compose -f ../docker-compose.local.yml logs -f"
echo "   • Stop services: docker-compose -f ../docker-compose.local.yml down"
echo "=============================="
