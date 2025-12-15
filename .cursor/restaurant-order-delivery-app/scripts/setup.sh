#!/bin/bash

# Restaurant Order & Delivery App - Initial Setup Script
# This script sets up a fresh Ubuntu 22.04 server for the application

set -e  # Exit on error

echo "=========================================="
echo "Restaurant App - Initial Setup"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}Please do not run as root${NC}"
   exit 1
fi

# Update system
echo -e "${YELLOW}Updating system packages...${NC}"
sudo apt update
sudo apt upgrade -y

# Install Node.js 20 LTS
echo -e "${YELLOW}Installing Node.js 20 LTS...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "Node.js already installed: $(node --version)"
fi

# Install PostgreSQL
echo -e "${YELLOW}Installing PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
else
    echo "PostgreSQL already installed: $(psql --version)"
fi

# Install Nginx
echo -e "${YELLOW}Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
else
    echo "Nginx already installed"
fi

# Install PM2
echo -e "${YELLOW}Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
else
    echo "PM2 already installed: $(pm2 --version)"
fi

# Install Redis (optional)
echo -e "${YELLOW}Installing Redis (optional)...${NC}"
read -p "Install Redis? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if ! command -v redis-server &> /dev/null; then
        sudo apt install -y redis-server
        sudo systemctl start redis-server
        sudo systemctl enable redis-server
    else
        echo "Redis already installed"
    fi
fi

# Create database and user
echo -e "${YELLOW}Setting up database...${NC}"
read -p "Database name (default: restaurant_app): " DB_NAME
DB_NAME=${DB_NAME:-restaurant_app}

read -p "Database user (default: restaurant_user): " DB_USER
DB_USER=${DB_USER:-restaurant_user}

read -sp "Database password: " DB_PASSWORD
echo

sudo -u postgres psql <<EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\q
EOF

echo -e "${GREEN}Database created successfully${NC}"

# Create application directory
echo -e "${YELLOW}Setting up application directory...${NC}"
read -p "Application directory (default: /opt/restaurant-app): " APP_DIR
APP_DIR=${APP_DIR:-/opt/restaurant-app}

if [ ! -d "$APP_DIR" ]; then
    sudo mkdir -p $APP_DIR
    sudo chown $USER:$USER $APP_DIR
fi

# Create storage directory
STORAGE_DIR="$APP_DIR/storage"
mkdir -p $STORAGE_DIR/{images,receipts,gift-cards}
mkdir -p $STORAGE_DIR/images/{menu-items,categories,restaurant,placeholders}

# Generate JWT secret
echo -e "${YELLOW}Generating JWT secret...${NC}"
JWT_SECRET=$(openssl rand -base64 32)

# Create .env file
echo -e "${YELLOW}Creating .env file...${NC}"
cat > $APP_DIR/.env <<EOF
# Application
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?schema=public

# Authentication
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=3d

# Stripe (Configure later)
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# PayPal (Configure later)
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_MODE=sandbox

# Email (Configure later)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
SMTP_SECURE=false

# Google Maps (Configure later)
GOOGLE_MAPS_API_KEY=

# reCAPTCHA (Optional)
RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=
ENABLE_RECAPTCHA=false

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# File Storage
UPLOAD_DIR=$STORAGE_DIR
MAX_FILE_SIZE=10485760

# Feature Flags
DEMO_MODE=true
SETUP_WIZARD_ENABLED=false
ENABLE_EMAIL_VERIFICATION=false
EOF

echo -e "${GREEN}.env file created at $APP_DIR/.env${NC}"
echo -e "${YELLOW}Please edit .env file with your configuration${NC}"

# Setup complete
echo -e "${GREEN}=========================================="
echo "Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Clone repository to $APP_DIR"
echo "2. Edit $APP_DIR/.env with your configuration"
echo "3. Run: cd $APP_DIR && npm install"
echo "4. Run: npm run db:migrate"
echo "5. Run: npm run db:seed"
echo "6. Run: npm run build"
echo "7. Configure Nginx (see deployment guide)"
echo "8. Setup SSL with certbot"
echo "9. Start with PM2: pm2 start npm --name restaurant-app -- start"
echo ""
echo "See docs/setup-installation.md for detailed instructions"

