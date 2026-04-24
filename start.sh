#!/bin/bash
set -e

echo "========================================="
echo "  AI Food Bank & Pantry Manager"
echo "  Starting Application..."
echo "========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

BACKEND_PORT=${BACKEND_PORT:-4000}
FRONTEND_PORT=${FRONTEND_PORT:-3000}

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    kill $(jobs -p) 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# Kill processes on ports
echo -e "${BLUE}Cleaning up ports...${NC}"
lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
echo -e "${GREEN}Ports $BACKEND_PORT and $FRONTEND_PORT cleared${NC}"

# Check PostgreSQL
echo -e "${BLUE}Checking PostgreSQL...${NC}"
if ! pg_isready -q 2>/dev/null; then
    echo -e "${YELLOW}Starting PostgreSQL...${NC}"
    brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || {
        echo -e "${RED}Please start PostgreSQL manually${NC}"
        exit 1
    }
    sleep 2
fi
echo -e "${GREEN}PostgreSQL is running${NC}"

# Create database if not exists
echo -e "${BLUE}Setting up database...${NC}"
psql -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'foodbank'" 2>/dev/null | grep -q 1 || \
    createdb foodbank 2>/dev/null || \
    createdb -U postgres foodbank 2>/dev/null || true
echo -e "${GREEN}Database ready${NC}"

# Install backend dependencies
echo -e "${BLUE}Installing backend dependencies...${NC}"
cd "$PROJECT_DIR/backend"
npm install
echo -e "${GREEN}Backend dependencies installed${NC}"

# Install frontend dependencies
echo -e "${BLUE}Installing frontend dependencies...${NC}"
cd "$PROJECT_DIR/frontend"
npm install
echo -e "${GREEN}Frontend dependencies installed${NC}"

# Run database seed
echo -e "${BLUE}Seeding database...${NC}"
cd "$PROJECT_DIR/backend"
node seed.js
echo -e "${GREEN}Database seeded${NC}"

# Start backend with nodemon
echo -e "${BLUE}Starting backend on port $BACKEND_PORT...${NC}"
cd "$PROJECT_DIR/backend"
npx nodemon server.js &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend with Vite
echo -e "${BLUE}Starting frontend on port $FRONTEND_PORT...${NC}"
cd "$PROJECT_DIR/frontend"
npx vite --port $FRONTEND_PORT --host &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  Application Started Successfully!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo -e "  Frontend: ${BLUE}http://localhost:$FRONTEND_PORT${NC}"
echo -e "  Backend:  ${BLUE}http://localhost:$BACKEND_PORT${NC}"
echo -e "${YELLOW}  Press Ctrl+C to stop${NC}"
echo ""

wait
