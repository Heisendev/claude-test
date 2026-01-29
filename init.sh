#!/bin/bash

# Claude.ai Clone - Initialization Script
# This script sets up the development environment and starts both frontend and backend servers

set -e  # Exit on error

echo "🚀 Initializing Claude.ai Clone Development Environment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

echo -e "${GREEN}✓${NC} npm version: $(npm --version)"

# Check for API key
if [ ! -f "/tmp/api-key" ]; then
    echo -e "${YELLOW}⚠${NC}  Warning: API key file not found at /tmp/api-key"
    echo "   The application will need a valid Anthropic API key to function."
fi

# Install frontend dependencies (pnpm pre-installed per spec)
echo ""
echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
if command -v pnpm &> /dev/null; then
    pnpm install
else
    echo "pnpm not found, using npm instead..."
    npm install
fi

# Install backend dependencies
echo ""
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
if [ -d "server" ]; then
    cd server
    npm install
    cd ..
else
    echo "Creating server directory..."
    mkdir -p server
    cd server

    # Initialize backend package.json
    npm init -y

    # Install backend dependencies
    npm install express cors better-sqlite3 @anthropic-ai/sdk dotenv
    npm install --save-dev nodemon

    cd ..
fi

echo ""
echo -e "${GREEN}✓${NC} Dependencies installed successfully!"

# Initialize database
echo ""
echo -e "${BLUE}🗄️  Initializing database...${NC}"
if [ -f "server/init-db.js" ]; then
    node server/init-db.js
    echo -e "${GREEN}✓${NC} Database initialized"
else
    echo -e "${YELLOW}⚠${NC}  Database initialization script not found yet (will be created during development)"
fi

# Start the application
echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "─────────────────────────────────────────────────"
echo -e "${BLUE}Starting Development Servers...${NC}"
echo "─────────────────────────────────────────────────"
echo ""

# Check if we should start in background or foreground
if [ "$1" == "--detached" ] || [ "$1" == "-d" ]; then
    echo "Starting servers in background mode..."

    # Start backend in background
    cd server
    npm run dev > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo -e "${GREEN}✓${NC} Backend server started (PID: $BACKEND_PID)"
    cd ..

    # Start frontend in background
    npm run dev > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo -e "${GREEN}✓${NC} Frontend server started (PID: $FRONTEND_PID)"

    echo ""
    echo "Servers are running in the background."
    echo "Backend PID: $BACKEND_PID"
    echo "Frontend PID: $FRONTEND_PID"
    echo ""
    echo "To stop the servers:"
    echo "  kill $BACKEND_PID $FRONTEND_PID"
    echo ""
    echo "To view logs:"
    echo "  tail -f backend.log"
    echo "  tail -f frontend.log"
else
    # Start in foreground mode using tmux or similar
    echo "Starting both servers..."
    echo ""
    echo -e "${YELLOW}Note:${NC} This will start both frontend and backend in the current terminal."
    echo "      Press Ctrl+C to stop both servers."
    echo ""

    # Create a function to handle cleanup on exit
    cleanup() {
        echo ""
        echo "Shutting down servers..."
        kill $BACKEND_PID 2>/dev/null || true
        kill $FRONTEND_PID 2>/dev/null || true
        exit 0
    }

    trap cleanup EXIT INT TERM

    # Start backend
    cd server
    npm run dev &
    BACKEND_PID=$!
    cd ..

    # Give backend a moment to start
    sleep 2

    # Start frontend
    npm run dev &
    FRONTEND_PID=$!

    echo ""
    echo "─────────────────────────────────────────────────"
    echo -e "${GREEN}🌟 Application is running!${NC}"
    echo "─────────────────────────────────────────────────"
    echo ""
    echo "Frontend: http://localhost:5173 (or configured port)"
    echo "Backend:  http://localhost:3000 (or configured port)"
    echo ""
    echo "Press Ctrl+C to stop both servers"
    echo ""

    # Wait for both processes
    wait
fi
