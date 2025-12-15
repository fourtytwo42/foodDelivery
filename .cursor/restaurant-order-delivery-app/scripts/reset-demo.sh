#!/bin/bash

# Restaurant Order & Delivery App - Daily Demo Reset Script
# This script resets the database and reseeds demo data
# Intended to be run via cron job daily

set -e  # Exit on error

# Configuration
APP_DIR="${APP_DIR:-/opt/restaurant-app}"
LOG_FILE="${LOG_FILE:-/var/log/restaurant-reset.log}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "${GREEN}Starting demo reset...${NC}"

# Change to app directory
cd "$APP_DIR" || {
    log "${RED}Error: Cannot change to $APP_DIR${NC}"
    exit 1
}

# Check if .env exists
if [ ! -f ".env" ]; then
    log "${RED}Error: .env file not found${NC}"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Reset database and reseed
log "${YELLOW}Resetting database...${NC}"
npm run db:reset

log "${YELLOW}Seeding demo data...${NC}"
npm run db:seed

log "${GREEN}Demo reset complete!${NC}"

# Optional: Restart application
# pm2 restart restaurant-app

exit 0

